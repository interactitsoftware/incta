import { Context } from "aws-lambda"
import { IItemManager, AartsEvent } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"

export const handler = async (evnt: AartsEvent, context: Context): Promise<any> => {
	!process.env.DEBUGGER || console.log('received AartsEvent: ', evnt)
	process.env.ringToken = evnt.meta.ringToken
	return await processPayload(evnt, context)
}

export async function processPayload(evnt: AartsEvent, context?: Context): Promise<any> {

	const asyncGen = processPayloadAsync(evnt)
	let processor = await asyncGen.next()
	do {
		if (!processor.done) {
			processor = await asyncGen.next()
			!process.env.DEBUGGER || console.log(`[${evnt.meta.item}:${evnt.meta.action}] `, ppjson(processor.value))
		}
	} while (!processor.done)

	return processor.value
}

export async function* processPayloadAsync(evnt: AartsEvent): AsyncGenerator<AartsEvent, AartsEvent, undefined> {

	!process.env.DEBUGGER || (yield Object.assign({}, evnt, { payload: { arguments: `[AartsHandler:processPayloadAsync] Checking payload for single element array: ${ppjson(evnt)}` } }))
	const payloadsArray = Array.isArray(evnt.payload.arguments) ? evnt.payload.arguments : [evnt.payload.arguments]
	Object.assign(evnt, {
		payload: {
			arguments: payloadsArray,
			identity: evnt.payload.identity
		}
	})
	if (evnt.payload.arguments.length > Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25)) {
		throw new Error(`[${evnt.meta.item}:baseValidateDelete] Payload is array an it excedes the max arguments array length constraint(${Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25)})`)
	} else if (evnt.payload.arguments.length > 1) {
		!process.env.DEBUGGER || (yield Object.assign({}, evnt, {eventType: "output", jobType: "short"}, { payload: { arguments: `[AartsHandler:processPayloadAsync] Payload is multi element array. Generating events for each element` } }))
		for (const payload of evnt.payload.arguments) {
			yield Object.assign({}, evnt, { eventType: "input", jobType:"short" }, { payload: {arguments: payload } } )
		}
		return Object.assign(evnt, {
			resultItems: `Generated new ${evnt.payload.arguments.length} input events`
		})
	}

	!process.env.DEBUGGER || (yield Object.assign({}, evnt, { payload: { arguments: `[AartsHandler:processPayloadAsync] Checking item manager for type ${evnt.meta.item}` } }))
	const manager = evnt.meta.action === "query" ?
		Object.values(global.domainAdapter.itemManagers)[0] as unknown as IItemManager<object>
		:
		global.domainAdapter.itemManagers[evnt.meta.item] as unknown as IItemManager<object>;
	if (!manager) {
		return Object.assign({}, evnt,
			{
				payload: {
					arguments: {
						topic: evnt.meta.item,
						errors: `[AartsHandler:processPayloadAsync] No manager present for type ${evnt.meta.item}!`
					}
				}
			})
	}

	!process.env.DEBUGGER || (yield Object.assign({}, evnt, { payload: { arguments: `[AartsHandler:processPayloadAsync] Will Invoke ${evnt.meta.item}:${evnt.meta.action} manager action` } }))
	let resultItems = []
	const asyncGen = manager[evnt.meta.action](evnt.meta.item, evnt)
	let processor = await asyncGen.next()
	do {
		if (!processor.done) {
			yield Object.assign({}, evnt, { payload: { arguments: processor.value.arguments } })
			processor = await asyncGen.next()
		}
	} while (!processor.done)
	resultItems = processor.value.arguments

	return Object.assign(evnt, {
		resultItems
	})
}