import { Context, DynamoDBStreamEvent } from "aws-lambda";
import { loginfo, ppjson, uuid, versionString } from "aarts-utils"
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { DB_NAME, fromAttributeMap } from "aarts-ddb/DynamoDbClient"
import { DynamoItem } from "aarts-ddb/DynamoItem"
import { chunks } from "aarts-utils";
import { controller } from "aarts-eb-dispatcher"
import { AppSyncEvent } from "aarts-eb-types";

export const dynamoEventsAggregation = async (evnt: DynamoDBStreamEvent, context: Context, cb: Function) => {
	let result = {}
	!process.env.DEBUGGER || loginfo({ ringToken: "aarts-ddb-events" }, "received", ppjson(evnt))

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
		!process.env.DEBUGGER || loginfo({ ringToken: "aarts-ddb-events" }, "new Image: ", ppjson(newImage))
		if (countersProcEventsMap.has(newImage["__proc"])) {
			if ((newImage["meta"] as string).startsWith("errored")) {
				if (rec.eventName === "MODIFY" && !!rec.dynamodb?.NewImage && Array.isArray(rec.dynamodb.NewImage.errors.L) && rec.dynamodb.NewImage.errors.L.length === 4) {
					//@ts-ignore, above we check for presence
					countersProcEventsMap.get(newImage["__proc"]).errored++
				}
			} else {
				//@ts-ignore, above we check for presence
				countersProcEventsMap.get(newImage["__proc"]).success++
			}
		} else {
			if ((newImage["meta"] as string).startsWith("errored")) {
				if (rec.eventName === "MODIFY" && !!rec.dynamodb?.NewImage && Array.isArray(rec.dynamodb.NewImage.errors.L) && rec.dynamodb.NewImage.errors.L.length === 4) {
					countersProcEventsMap.set(newImage["__proc"], { success: 0, errored: 1 })
				}
			} else {
				countersProcEventsMap.set(newImage["__proc"], { success: 1, errored: 0 })
			}
		}
	}
	!process.env.DEBUGGER || console.log("ENTERS AGGREGATION OF PROC EVENTS ", countersProcEventsMap)

	await publishProcAggregatesUpdate(countersProcEventsMap)
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

		await publishItemAggregatesUpdate(typesByStatusesMapOld, 'subtracting')
		await publishItemAggregatesUpdate(typesByStatusesMapNew, 'adding')

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

		await publishItemAggregatesUpdate(typesByStatusesMapNew, 'adding')
	}
	//#endregion

	return result
}


const publishProcAggregatesUpdate = async (updateMap: Map<string, { success: number, errored: number }>) => {
	for (const chunkedIds of chunks(Array.from(updateMap.keys()), Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25))) {
		// sending each update for processing in its own lambda!!! (ensuring retries will kick in if there are multiple conflicting updates)
		await controller({
			//"x" values not necessary here. Can it be deleted or for typescript not complaining to leave it ?
			"forcePublishToBus": true,
			"action": "x",
			"item": "x",
			"jobType": "long",
			"ringToken": "aarts-ddb-events",
			"arguments": chunkedIds.map(c => {
				const updateProcRequest = {
					Update: {
						TableName: DB_NAME,
						Key: Object.assign({
							id: { S: c },
							meta: { S: `${versionString(0)}|${c.substr(0, c.indexOf("|"))}` },
						}),
						UpdateExpression: `SET #processed_events = if_not_exists(#processed_events, :zero) + :inc_success, #errored_events = if_not_exists(#errored_events, :zero) + :inc_errored`,
						ExpressionAttributeNames: { [`#processed_events`]: "processed_events", [`#errored_events`]: "errored_events" },
						ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc_success": { "N": `${updateMap.get(c)?.success}` }, ":inc_errored": { "N": `${updateMap.get(c)?.errored}` } }
					}
				}
				const aartsEvent: AppSyncEvent = {
					action: "update",
					item: "BASE",
					arguments: {
						TransactItems: [updateProcRequest],
						ReturnConsumedCapacity: "TOTAL",
						ReturnItemCollectionMetrics: "SIZE",
						// ClientRequestToken: uuid()
					},
					"identity": {
						"username": "akrsmv"
					},
					forcePublishToBus: true,
					eventType: "input",
					jobType: "short",
					ringToken: "aarts-ddb-events"
				}
				return aartsEvent
			}),
			"identity": {
				"username": "akrsmv"
			}
		})
	}
}

const publishItemAggregatesUpdate = async (updateMap: Map<string, number>, adding: 'adding'|'subtracting') => {
	for (const chunkedIds of chunks(Array.from(updateMap.keys()), Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25))) {
		// sending each update for processing in its own lambda!!! (ensuring retries will kick in if there are multiple conflicting updates)
		await controller({
			//"x" values not necessary here. Can it be deleted or for typescript not complaining to leave it ?
			"forcePublishToBus": true,
			"action": "x",
			"item": "x",
			"jobType": "long",
			"ringToken": "aarts-ddb-events",
			"arguments": chunkedIds.map(c => {
				const updateProcRequest = {
					Update: {
						TableName: DB_NAME,
						Key: Object.assign({
							id: { S: "aggregations" },
							meta: { S: c },
						}),
						UpdateExpression: `SET #count = if_not_exists(#count, :zero) ${adding === 'adding' ? '+' : '-'} :inc`,
						ExpressionAttributeNames: { [`#count`]: "count" },
						ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc": { "N": `${updateMap.get(c)}` } }
					}
				}
				const aartsEvent: AppSyncEvent = {
					action: "update",
					item: "BASE",
					arguments: {
						TransactItems: [updateProcRequest],
						ReturnConsumedCapacity: "TOTAL",
						ReturnItemCollectionMetrics: "SIZE",
						//ClientRequestToken: uuid()
					},
					"identity": {
						"username": "akrsmv"
					},
					forcePublishToBus: true,
					eventType: "input",
					jobType: "short",
					ringToken: "aarts-ddb-events"
				}
				return aartsEvent
			}),
			"identity": {
				"username": "akrsmv"
			}
		})
	}
}
