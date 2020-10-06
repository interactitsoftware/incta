import { Context, DynamoDBStreamEvent } from "aws-lambda";
import { loginfo, ppjson, uuid, versionString } from "aarts-utils/utils"
import { AttributeMap, TransactWriteItemList, TransactWriteItemsInput } from "aws-sdk/clients/dynamodb";
import { DB_NAME, ddbRequest, dynamoDbClient, fromAttributeMap } from "aarts-dynamodb/DynamoDbClient"
import { DynamoItem } from "aarts-dynamodb/BaseItemManager"

export const dynamoEventsAggregation = async (event: DynamoDBStreamEvent, context: Context, cb: Function) => {
	let result = {}
	console.log("received", ppjson(event))

	try {
		//#region // -------------------- AGGREGATE PROCEDURE's PROCESSED EVENTS --------------------
		const countersProcEventsMap = new Map<string, number>()
		for (const rec of event.Records.filter(record =>
			(!!record.dynamodb?.NewImage && record.dynamodb?.NewImage["meta"] && (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(versionString(0))))) { // fire only for main items
			const newImage = fromAttributeMap(rec.dynamodb?.NewImage as AttributeMap) as DynamoItem
			console.log("new Image: " +  ppjson(newImage))
			if (!!newImage["procedure"] && newImage.ringToken === newImage["procedure"].substr(newImage["procedure"].indexOf("|") + 1)) {
				if (countersProcEventsMap.has(newImage["procedure"])) {
					countersProcEventsMap.set(newImage["procedure"], (countersProcEventsMap.get(newImage["procedure"]) as number) + 1)
				} else {
					countersProcEventsMap.set(newImage["procedure"], 1)
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
						UpdateExpression: `SET #processed_events = if_not_exists(#processed_events, :zero) + :inc`,
						ExpressionAttributeNames: { [`#processed_events`]: "processed_events" },
						ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc": { "N": `${countersProcEventsMap.get(id)}` } }
					}
				}
			]

			const params: TransactWriteItemsInput = {
				TransactItems: transactItemList,
				ReturnConsumedCapacity: "TOTAL",
				ReturnItemCollectionMetrics: "SIZE",
				ClientRequestToken: uuid()
			}
			const resultUpdateProcEvents = await ddbRequest(dynamoDbClient.transactWriteItems(params))
			!process.env.DEBUGGER || loginfo("====DDB==== UpdateItemOutput: ", ppjson(resultUpdateProcEvents))
		}
		//#endregion

		//#region // -------------------- AGGREGATE ITEM COUNTERS BY TYPE AND STATE --------------------
		if (!process.env.DO_NOT_AGGREGATE) {
			const typesByStatusesMapNew = new Map<string, number>()
			const typesByStatusesMapOld = new Map<string, number>()
			for (const rec of event.Records.filter(record => record.eventSource === "aws:dynamodb" && record.eventName === "MODIFY"
				&& !!record.dynamodb?.NewImage && !!record.dynamodb?.OldImage
				&& (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(versionString(0))
				&& (((record.dynamodb?.NewImage as { item_state: { S: string } })["item_state"] || {S: "undefined"}).S) !== (((record.dynamodb?.OldImage as { item_state: { S: string } })["item_state"] || {S:"undefined"}).S))) { // fire only for main items

				// update aggregations
				// total items of this type and state
					const oldCounter = `${((rec.dynamodb?.NewImage as { item_type: { S: string } })["item_type"] || {S:"undefined"}).S}|${((rec.dynamodb?.OldImage as { item_state: { S: string } })["item_state"] || {S:"undefined"}).S}`
					const newCounter = `${((rec.dynamodb?.NewImage as { item_type: { S: string } })["item_type"] || {S:"undefined"}).S}|${((rec.dynamodb?.NewImage as { item_state: { S: string } })["item_state"] || {S:"undefined"}).S}`
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
				}))
				!process.env.DEBUGGER || loginfo("====DDB==== UpdateItemOutput: ", ppjson(resultUpdateAggrTotalByOldState))
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
				}))
				!process.env.DEBUGGER || loginfo("====DDB==== UpdateItemOutput: ", ppjson(resultUpdateAggrTotalByNewState))
			}


			// ----------- AGGREGATE NEW RECORDS ----------------
			typesByStatusesMapNew.clear()
			for (const rec of event.Records.filter(record => record.eventSource === "aws:dynamodb" && record.eventName === "INSERT"
				&& !!record.dynamodb?.NewImage && (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(`v_0`))) { // fire only for main items

				const counter = `${((rec.dynamodb?.NewImage as { item_type: { S: string } })["item_type"] || {S:"undefined"}).S}|${((rec.dynamodb?.NewImage as { item_state: { S: string } })["item_state"] || {S:"undefined"}).S}`

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
				}))
				!process.env.DEBUGGER || loginfo("====DDB==== UpdateItemOutput: ", ppjson(resultUpdateAggrTotalByNewState))
			}
		}
		//#endregion

	} catch (err) {
		console.error(err)
		cb(null, `Swallowed the error ${JSON.stringify(err)}`)
	}
	return result
}

