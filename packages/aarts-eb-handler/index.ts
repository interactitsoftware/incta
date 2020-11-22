import { Context, SQSEvent } from "aws-lambda"
import { AartsEvent, IItemManagerKeys, AartsPayload } from "aarts-types/interfaces"
import { loginfo, ppjson } from "aarts-utils"
import { processPayloadAsync } from 'aarts-handler/aartsHandler'
import { publish, AppSyncEvent } from 'aarts-eb-types'
import { prepareAartsEventForDispatch } from 'aarts-eb-types/prepareAartsEventForDispatch'
import { prepareAppSyncEventForDispatch } from 'aarts-eb-types/prepareAppSyncEventForDispatch'


export const worker = async (message: SQSEvent, context: Context): Promise<any> => {
	for (const record of message.Records) {
		!process.env.DEBUGGER || loginfo({ringToken: record.messageAttributes["ringToken"].stringValue as string}, 'received SQS Record: ', ppjson(message))
		const aartsEvent: AartsEvent = Object.assign(JSON.parse(record.body),
			{
				meta: {
					item: record.messageAttributes["item"].stringValue as string,
					action: record.messageAttributes["action"].stringValue as IItemManagerKeys,
					ringToken: record.messageAttributes["ringToken"].stringValue as string,
					eventSource: record.messageAttributes["eventSource"].stringValue as string,
					sqsMsgId: record.messageId
				}
			})
		!process.env.DEBUGGER || loginfo({ringToken: aartsEvent.meta.ringToken}, 'parsed aartsEvent from SQS is ', ppjson(aartsEvent))
		return await processPayload(aartsEvent, context)
	}
}


export const processPayload = async (input: AartsEvent, context?: Context): Promise<any> => {
	process.env.DO_NOT_PRINT_RECEIVED_AARTS_PAYLOAD || loginfo({ringToken: input.meta.ringToken}, "Received input ", ppjson(input));

	//#region 
	// SPECIAL CASE IF ITS ACTUALLY NOT REALLY AartsEvent yet, i.e no meta present, its still an AppSyncEvent (because of direct calls to this method from procedures's start method ) 
	if (Array.isArray(input.payload.arguments) && input.payload.arguments.length > Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25)) {
		throw new Error(`${input.meta.ringToken}: [${input.meta.item}:baseValidateDelete] Payload is array an it excedes the max arguments array length constraint(${Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25)})`)
	} else if (Array.isArray(input.payload.arguments) && ["query", "get"].indexOf((input as unknown as AppSyncEvent).action) === -1 && input.payload.arguments.length >= 1) {

		// below 'peace of sh art' left for reference 
		//!process.env.DEBUGGER || (await publish(prepareAartsEventForDispatch(Object.assign({}, input, { meta: { action: input.meta.action, ringToken: input.meta.ringToken, item: input.meta.ringToken }, payload: { identity: input.payload.identity, result: [{ message: `[AartsHandler:processPayloadAsync] Payload is multi element array. Generating events for each element` }] } }))))

		!process.env.DEBUGGER || loginfo({ringToken: input.meta.ringToken}, `[AartsHandler:processPayloadAsync] Payload is multi element array. Generating events for each element of the array: `, ppjson(input))
		for (const payload of input.payload.arguments) {
			!process.env.DEBUGGER || loginfo({ringToken: input.meta.ringToken}, "In the loop of multiplying events: ", ppjson(payload));
			await publish(prepareAppSyncEventForDispatch(payload, payload.ringToken))
		}
		return Object.assign({}, input, {
			payload: {
				result: [{
					message: `Generated new ${input.payload.arguments.length} input events`
				}]
			}
		})
	}
	//#endregion

	const asyncGen = processPayloadAsync(input)
	let processor
	do {
		processor = await asyncGen.next()
		!process.env.DEBUGGER || loginfo({ringToken: input.meta.ringToken}, `[${input.meta.item}:${input.meta.action}] `, ppjson(processor.value))
		!processor.done && (await publish(prepareAartsEventForDispatch(Object.assign({}, input, { payload: { result: processor.value } }))))
	} while (!processor.done)

	!process.env.DEBUGGER || loginfo({ringToken: input.meta.ringToken}, "returning from AartsSQSHandler.processPayload", ppjson(processor.value))

	return Object.assign({}, input, { payload: { result: (processor.value as AartsPayload).result } })
}
