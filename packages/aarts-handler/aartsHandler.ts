import { Context } from "aws-lambda"
import { IItemManager, AartsEvent } from "aarts-types/interfaces"
import { ppjson, loginfo } from "aarts-utils"

export const handler = async (evnt: AartsEvent, context: Context): Promise<any> => {
	!process.env.DEBUGGER || loginfo('received AartsEvent: ', evnt)
	process.env.ringToken = evnt.meta.ringToken
	return await processPayload(evnt, context)
}

export async function processPayload(evnt: AartsEvent, context?: Context): Promise<any> {

	const asyncGen = processPayloadAsync(evnt)
	let processor
	do {
		processor = await asyncGen.next()
		!process.env.DEBUGGER || loginfo(`[${evnt.meta.item}:${evnt.meta.action}] `, processor.value.payload.resultItems)
	} while (!processor.done)

	return Object.assign({}, evnt, {
		payload: {
			resultItems: processor.value.payload.resultItems
		}
	})
}

export async function* processPayloadAsync(evnt: AartsEvent): AsyncGenerator<AartsEvent, AartsEvent, undefined> {
	// stop sending debug messages over the bus
	// process.env.DO_NOT_PRINT_RECEIVED_AARTS_PAYLOAD || (yield Object.assign({}, evnt, { payload: { resultItems: [{ message: `[AartsHandler:processPayloadAsync] Received payload: ${ppjson(evnt)}` }] } }))

	process.env.DO_NOT_PRINT_RECEIVED_AARTS_PAYLOAD || loginfo(`[AartsHandler:processPayloadAsync] Received payload: `, evnt)
	const payloadsArray = Array.isArray(evnt.payload.arguments) ? evnt.payload.arguments : [evnt.payload.arguments]
	Object.assign(evnt, {
		payload: {
			arguments: payloadsArray,
			identity: evnt.payload.identity,
			selectionSetList: evnt.payload.selectionSetList
		}
	})

	// !process.env.DEBUGGER || (yield Object.assign({}, evnt, { payload: { resultItems: { message: `[AartsHandler:processPayloadAsync] Checking item manager for type ${evnt.meta.item}` } } }))

	!process.env.DEBUGGER || loginfo(`[AartsHandler:processPayloadAsync] Checking item manager for type ${evnt.meta.item}`)
	if (evnt.meta.action === "start") {
		evnt.meta.item = "P__" + evnt.meta.item
	}
	let manager = global.domainAdapter.itemManagers[evnt.meta.item] as unknown as IItemManager<object>
	if (!manager && (evnt.meta.action === "query" || evnt.meta.action === "get")) {
		manager = Object.values(global.domainAdapter.itemManagers)[0] as unknown as IItemManager<object>
	}


	if (!manager) {
		return Object.assign({}, evnt,
			{
				payload: {
					resultItems: [{
						errors: `[AartsHandler:processPayloadAsync] No manager present for type ${evnt.meta.item}!`
					}]
				}
			})
	}

	!process.env.DEBUGGER || loginfo(`[AartsHandler:processPayloadAsync] Will Invoke ${evnt.meta.item}:${evnt.meta.action} manager action`)

	const asyncGen = manager[evnt.meta.action](evnt.meta.item, evnt)
	let processor = await asyncGen.next()
	yield Object.assign({}, evnt, { payload: { resultItems: processor.value.resultItems } })
	do {
		if (!processor.done) {
			processor = await asyncGen.next()
			yield Object.assign({}, evnt, { payload: { resultItems: processor.value.resultItems } })
		}
	} while (!processor.done)

	return Object.assign({}, evnt, {
		payload: {
			resultItems: processor.value.resultItems
		}
	})
}