import { Context, DynamoDBStreamEvent } from "aws-lambda";
import { loginfo, ppjson, uuid, versionString } from "aarts-utils"
import { AttributeMap, TransactWriteItemList, TransactWriteItemsInput } from "aws-sdk/clients/dynamodb";
import { DB_NAME, ddbRequest, dynamoDbClient, fromAttributeMap } from "aarts-ddb/DynamoDbClient"
import { DynamoItem } from "aarts-ddb/DynamoItem"

export const dynamoEventsAggregation = async (evnt: DynamoDBStreamEvent, context: Context, cb: Function) => {
	let result = {}
	!process.env.DEBUGGER || loginfo({ringToken: "aarts-ddb-events"}, "received", ppjson(evnt))

	try {
		//#region // -------------------- AGGREGATE PROCEDURE's PROCESSED/ERRORED EVENTS --------------------
		const countersProcEventsMap = new Map<string, { success: number, errored: number }>()
		for (const rec of evnt.Records.filter(record =>
			(
				!!record.dynamodb?.NewImage
				&&
				!!record.dynamodb?.NewImage["meta"]
				&&
				!!record.dynamodb?.NewImage["__proc"]
				&&
				!!record.dynamodb?.NewImage["ringToken"]
				// fire only for main items
				&& (
					(record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(versionString(0))
					|| // or for errored procedures
					(record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith("errored")
					|| // or for items that are refkeys, added as part of DB migrations (only those will have __proc and ringtoken)
					(record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.indexOf("}") > 0)
				&& 
				// fire only for items which were indeed changed as part of a parocedure
				//(__proc key can become obsolate as it remains in the item, thats why compare it to the ringToken, which is always updated)
				((record.dynamodb?.NewImage as { ringToken: { S: string } })["ringToken"].S as string) === ((record.dynamodb?.NewImage as { __proc: { S: string } })["__proc"].S as string).substr(((record.dynamodb?.NewImage as { __proc: { S: string } })["__proc"].S as string).indexOf("|") + 1)
			)
		)) {
			// TODO make it faster, remove the fromAttributeMap call and directly use the record only
			const newImage = fromAttributeMap(rec.dynamodb?.NewImage as AttributeMap) as DynamoItem
			!process.env.DEBUGGER || loginfo({ringToken: "aarts-ddb-events"}, "new Image: ", ppjson(newImage))
			if (countersProcEventsMap.has(newImage["__proc"])) {
				if ((newImage["meta"] as string).startsWith("errored")) {
					//@ts-ignore, above we check for presence
					countersProcEventsMap.get(newImage["__proc"]).errored++
				} else {
					//@ts-ignore, above we check for presence
					countersProcEventsMap.get(newImage["__proc"]).success++
				}
			} else {
				if ((newImage["meta"] as string).startsWith("errored")) {
					countersProcEventsMap.set(newImage["__proc"], { success: 0, errored: 1 })
				} else {
					countersProcEventsMap.set(newImage["__proc"], { success: 1, errored: 0 })
				}
			}
		}

		// issue aggregated processed_events updates
		for (const id of countersProcEventsMap.keys()) {
			const transactItemList: TransactWriteItemList = [
				{
					Update: {
						TableName: DB_NAME,
						Key: Object.assign({
							id: { S: id },
							meta: { S: `${versionString(0)}|${id.substr(0, id.indexOf("|"))}` },
						}),
						UpdateExpression: `SET #processed_events = if_not_exists(#processed_events, :zero) + :inc_success, #errored_events = if_not_exists(#errored_events, :zero) + :inc_errored`,
						ExpressionAttributeNames: { [`#processed_events`]: "processed_events", [`#errored_events`]: "errored_events" },
						ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc_success": { "N": `${countersProcEventsMap.get(id)?.success}` }, ":inc_errored": { "N": `${countersProcEventsMap.get(id)?.errored}` } }
					}
				}
			]

			const params: TransactWriteItemsInput = {
				TransactItems: transactItemList,
				ReturnConsumedCapacity: "TOTAL",
				ReturnItemCollectionMetrics: "SIZE",
				ClientRequestToken: uuid()
			}
			const resultUpdateProcEvents = await ddbRequest(dynamoDbClient.transactWriteItems(params), "aarts-ddb-events")
			!process.env.DEBUGGER || loginfo({ringToken: "aarts-ddb-events"}, "====DDB==== UpdateItemOutput: ", ppjson(resultUpdateProcEvents))
		}
		//#endregion

		//#region // -------------------- AGGREGATE ITEM COUNTERS BY TYPE AND STATE --------------------
		if (!process.env.DO_NOT_AGGREGATE) {
			const typesByStatusesMapNew = new Map<string, number>()
			const typesByStatusesMapOld = new Map<string, number>()
			for (const rec of evnt.Records.filter(record => record.eventSource === "aws:dynamodb" && record.eventName === "MODIFY"
				&& !!record.dynamodb?.NewImage && !!record.dynamodb?.OldImage
				&& (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(versionString(0))
				&& (((record.dynamodb?.NewImage as { item_state: { S: string } })["item_state"] || { S: "undefined" }).S) !== (((record.dynamodb?.OldImage as { item_state: { S: string } })["item_state"] || { S: "undefined" }).S))) { // fire only for main items

				// update aggregations
				// total items of this type and state
				const oldCounter = `${((rec.dynamodb?.NewImage as { __typename: { S: string } })["__typename"] || { S: "undefined" }).S}|${((rec.dynamodb?.OldImage as { item_state: { S: string } })["item_state"] || { S: "undefined" }).S}`
				const newCounter = `${((rec.dynamodb?.NewImage as { __typename: { S: string } })["__typename"] || { S: "undefined" }).S}|${((rec.dynamodb?.NewImage as { item_state: { S: string } })["item_state"] || { S: "undefined" }).S}`
				if (typesByStatusesMapNew.has(newCounter)) {
					typesByStatusesMapNew.set(newCounter, (typesByStatusesMapNew.get(newCounter) as number) + 1)
				} else {
					typesByStatusesMapNew.set(newCounter, 1)
				}
				if (typesByStatusesMapOld.has(oldCounter)) {
					typesByStatusesMapOld.set(oldCounter, (typesByStatusesMapOld.get(oldCounter) as number) + 1)
				} else {
					typesByStatusesMapOld.set(oldCounter, 1)
				}
			}

			for (const typestateOld of typesByStatusesMapOld.keys()) {
				const resultUpdateAggrTotalByOldState = await ddbRequest(dynamoDbClient.updateItem({
					TableName: DB_NAME,
					Key: Object.assign({
						id: { S: "aggregations" },
						meta: { S: typestateOld },
					}),
					UpdateExpression: `SET #count = if_not_exists(#count, :zero) - :inc`,
					ExpressionAttributeNames: { [`#count`]: "count" },
					ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc": { "N": `${typesByStatusesMapOld.get(typestateOld)}` } },
					ReturnValues: "ALL_NEW"
				}), "aarts-ddb-events")
				!process.env.DEBUGGER || loginfo({ringToken: "aarts-ddb-events"}, "====DDB==== UpdateItemOutput: ", ppjson(resultUpdateAggrTotalByOldState))
			}


			for (const typestateNew of typesByStatusesMapNew.keys()) {
				const resultUpdateAggrTotalByNewState = await ddbRequest(dynamoDbClient.updateItem({
					TableName: DB_NAME,
					Key: Object.assign({
						id: { S: "aggregations" },
						meta: { S: typestateNew },
					}),
					UpdateExpression: `SET #count = if_not_exists(#count, :zero) + :inc`,
					ExpressionAttributeNames: { [`#count`]: "count" },
					ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc": { "N": `${typesByStatusesMapNew.get(typestateNew)}` } },
					ReturnValues: "ALL_NEW"
				}), "aarts-ddb-events")
				!process.env.DEBUGGER || loginfo({ringToken: "aarts-ddb-events"}, "====DDB==== UpdateItemOutput: ", ppjson(resultUpdateAggrTotalByNewState))
			}


			// ----------- AGGREGATE NEW RECORDS ----------------
			typesByStatusesMapNew.clear()
			for (const rec of evnt.Records.filter(record => record.eventSource === "aws:dynamodb" && record.eventName === "INSERT"
				&& !!record.dynamodb?.NewImage && (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(`v_0`))) { // fire only for main items

				const counter = `${((rec.dynamodb?.NewImage as { __typename: { S: string } })["__typename"] || { S: "undefined" }).S}|${((rec.dynamodb?.NewImage as { item_state: { S: string } })["item_state"] || { S: "undefined" }).S}`

				if (typesByStatusesMapNew.has(counter)) {
					typesByStatusesMapNew.set(counter, (typesByStatusesMapNew.get(counter) as number) + 1)
				} else {
					typesByStatusesMapNew.set(counter, 1)
				}
			}

			for (const typestateNew of typesByStatusesMapNew.keys()) {
				const resultUpdateAggrTotalByNewState = await ddbRequest(dynamoDbClient.updateItem({
					TableName: DB_NAME,
					Key: Object.assign({
						id: { S: "aggregations" },
						meta: { S: typestateNew },
					}),
					UpdateExpression: `SET #count = if_not_exists(#count, :zero) + :inc`,
					ExpressionAttributeNames: { [`#count`]: "count" },
					ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc": { "N": `${typesByStatusesMapNew.get(typestateNew)}` } },
					ReturnValues: "ALL_NEW"
				}), "aarts-ddb-events")
				!process.env.DEBUGGER || loginfo({ringToken: "aarts-ddb-events"}, "====DDB==== UpdateItemOutput: ", ppjson(resultUpdateAggrTotalByNewState))
			}
		}
		//#endregion

	} catch (err) {
		console.error(err)
		cb(null, `Swallowed the error ${JSON.stringify(err)}`)
	}
	return result
}

