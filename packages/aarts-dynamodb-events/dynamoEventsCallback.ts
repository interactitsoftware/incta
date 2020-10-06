import { Context, DynamoDBStreamEvent } from "aws-lambda";
import { IItemManagerCallback } from "aarts-types/interfaces";
import { ppjson, versionString } from "aarts-utils/utils"

export const dynamoEventsCallback = async (event: DynamoDBStreamEvent, context: Context, cb: Function) => {
	let result = {}
	console.log("received", ppjson(event))

	try {
		//#region // -------------------- INVOKE _onUpdate callback --------------------
		for (const rec of event.Records.filter(record => record.eventSource === "aws:dynamodb" && record.eventName === "MODIFY"
			&& !!record.dynamodb?.NewImage && !!record.dynamodb?.OldImage
			&& (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(versionString(0)))) { // fire only for main items

			const __type = `${(rec.dynamodb?.Keys as { id: { S: string }, meta: { S: string } }).id.S.substr(0, (rec.dynamodb?.Keys as { id: { S: string }, meta: { S: string } }).id.S.indexOf("|"))}`
			const itemManagerCallback = global.domainAdapter.itemManagers[__type] as unknown as IItemManagerCallback<object>;
			await itemManagerCallback._onUpdate(__type, rec.dynamodb)
		}

		// ----------- INVOKE _onCreate callback ----------------
		for (const rec of event.Records.filter(record => record.eventSource === "aws:dynamodb" && record.eventName === "INSERT"
			&& !!record.dynamodb?.NewImage && (record.dynamodb?.NewImage as { meta: { S: string } })["meta"].S.startsWith(`v_0`))) { // fire only for main items

			const __type = `${(rec.dynamodb?.Keys as { id: { S: string }, meta: { S: string } }).id.S.substr(0, (rec.dynamodb?.Keys as { id: { S: string }, meta: { S: string } }).id.S.indexOf("|"))}`
			const itemManagerCallback = global.domainAdapter.itemManagers[__type] as unknown as IItemManagerCallback<object>;
			await itemManagerCallback._onCreate(__type, rec.dynamodb)
		}
		//#endregion
	} catch (err) {
		console.error(err)
		cb(null, `Swallowed the error ${JSON.stringify(err)}`)
	}
	return result
}

