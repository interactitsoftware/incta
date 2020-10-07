import { Context, SQSEvent } from "aws-lambda"
import { AartsEvent, IItemManagerKeys } from "aarts-types/interfaces"
import { loginfo, ppjson } from "aarts-utils/utils"
import { processPayloadAsync } from 'aarts-handler/aartsHandler'
import { publish, AppSyncEvent } from 'aarts-eb-types/aartsEBUtil'
import { prepareAartsEventForDispatch } from 'aarts-eb-types/prepareAartsEventForDispatch'
import { prepareAppSyncEventForDispatch } from 'aarts-eb-types/prepareAppSyncEventForDispatch'


export const handler = async (message: SQSEvent, context: Context): Promise<any> => {
	!process.env.DEBUGGER || loginfo('received SQS message: ', ppjson(message))
	for (const record of message.Records) {
		const aartsEvent: AartsEvent = Object.assign(JSON.parse(record.body),
			{
				meta: {
					item: record.messageAttributes["item"].stringValue as string,
					action: record.messageAttributes["action"].stringValue as IItemManagerKeys,
					ringToken: record.messageAttributes["ringToken"].stringValue as string,
					eventSource: record.messageAttributes["eventSource"].stringValue as string

				}
			})
		!process.env.DEBUGGER || loginfo('parsed aartsEvent from SQS is ', ppjson(aartsEvent))
		process.env.ringToken = aartsEvent.meta.ringToken
		return await processPayload(aartsEvent, context)
	}
}


export const processPayload = async (input: AartsEvent, context?: Context): Promise<any> => {
	process.env.DO_NOT_PRINT_RECEIVED_AARTS_PAYLOAD || loginfo("Received input ", input);

	//#region 
	// SPECIAL CASE IF ITS ACTUALLY NOT REALLY AartsEvent yet, i.e no meta present, its still an AppSyncEvent (because of direct calls to this method from procedures ) 
	if (Array.isArray(input.payload.arguments) && input.payload.arguments.length > Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25)) {
		throw new Error(`${process.env.ringToken}: [${input.meta.item}:baseValidateDelete] Payload is array an it excedes the max arguments array length constraint(${Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25)})`)
	} else if (Array.isArray(input.payload.arguments) && ["query", "get"].indexOf((input as unknown as AppSyncEvent).action) === -1 && input.payload.arguments.length >= 1) {
		console.log("SQSSQS-TRALALA SHTE RAZPRASHTA ", ppjson(input.payload.arguments));
		!process.env.DEBUGGER || (await publish(prepareAartsEventForDispatch(Object.assign({}, input, { meta: { action: input.meta.action, ringToken: input.meta.ringToken, item: input.meta.ringToken }, payload: { identity: input.payload.identity, resultItems: [{ message: `[AartsHandler:processPayloadAsync] Payload is multi element array. Generating events for each element` }] } }))))
		for (const payload of input.payload.arguments) {
			console.log("SHTE V CIKULA PRASHTA: ", ppjson(payload));
			//its an input here
			// object assign here is actually constructing the aarts event
			await publish(prepareAppSyncEventForDispatch(payload, payload.ringToken))
		}
		return Object.assign({}, input, {
			payload: {
				resultItems: [{
					message: `Generated new ${input.payload.arguments.length} input events`
				}]
			}
		})
	}
	//#endregion

	const asyncGen = processPayloadAsync(input)

	let processor = await asyncGen.next()
	await publish(prepareAartsEventForDispatch(Object.assign({}, input, { payload: { resultItems: processor.value.payload.resultItems, identity: input.payload.identity } })))
	do {
		if (!processor.done) {
			processor = await asyncGen.next()
			!process.env.DEBUGGER || loginfo(`[${input.meta.item}:${input.meta.action}] `, ppjson(processor.value))
			await publish(prepareAartsEventForDispatch(Object.assign({}, input, { payload: { resultItems: processor.value.payload.resultItems, identity: input.payload.identity } })))

		}
	} while (!processor.done)

	!process.env.DEBUGGER || loginfo("returning from AartsSQSHandler.processPayload " + ppjson(processor.value))

	return Object.assign({}, input, { payload: { resultItems: processor.value.payload.resultItems, identity: input.payload.identity } })
}

