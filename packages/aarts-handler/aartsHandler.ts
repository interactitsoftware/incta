import { Context } from "aws-lambda"
import { IItemManager, AartsEvent, AartsPayload } from "aarts-types/interfaces"
import { loginfo, ppjson } from "aarts-utils"

export const handler = async (evnt: AartsEvent, context: Context): Promise<any> => {
	!process.env.DEBUGGER || loginfo({ringToken: evnt.meta.ringToken}, 'received AartsEvent: ', ppjson(evnt))
	return await processPayload(evnt, context)
}

export async function processPayload(evnt: AartsEvent, context?: Context): Promise<AartsPayload> {

	const asyncGen = processPayloadAsync(evnt)
	let processor
	do {
		processor = await asyncGen.next()
		!process.env.DEBUGGER || (!processor.done && loginfo({ringToken: evnt.meta.ringToken}, `[${evnt.meta.item}:${evnt.meta.action}] yielded: `, ppjson(processor.value)))
	} while (!processor.done)
	!process.env.DEBUGGER || loginfo({ringToken: evnt.meta.ringToken}, `[${evnt.meta.item}:${evnt.meta.action}] returned: `, ppjson(processor.value))

	return {
		result: (processor.value as AartsPayload).result
	}
}

export async function* processPayloadAsync(evnt: AartsEvent): AsyncGenerator<string, AartsPayload, never> {
	// stop sending debug messages over the bus
	// process.env.DO_NOT_PRINT_RECEIVED_AARTS_PAYLOAD || (yield Object.assign({}, evnt, { payload: { result: [{ message: `[AartsHandler:processPayloadAsync] Received payload: ${ppjson(evnt)}` }] } }))

	process.env.DO_NOT_PRINT_RECEIVED_AARTS_PAYLOAD || loginfo({ringToken: evnt.meta.ringToken}, `[AartsHandler:processPayloadAsync] Received payload: `, ppjson(evnt))
	if (Array.isArray(evnt.payload.arguments)) {
		throw new Error('payload.arguments cannot be an array!')
	}

	!process.env.DEBUGGER || loginfo({ringToken: evnt.meta.ringToken}, `[AartsHandler:processPayloadAsync] Checking item manager for type ${evnt.meta.item}`)

	// decorate procedure types, to track their async performance later
	if (evnt.meta.action === "start") {
		evnt.meta.item = "P__" + evnt.meta.item
	}
	let manager = global.domainAdapter.itemManagers[evnt.meta.item] as unknown as IItemManager<object>

	// when calling query or get action it actually doesnt matter the specific manager type
	// aarts-cli is adding "BASE" type manager as first element in items lookup map
	if (!manager && (evnt.meta.action === "query" || evnt.meta.action === "get")) {
		manager = Object.values(global.domainAdapter.itemManagers)[0] as unknown as IItemManager<object>
	}

	if (!manager) {
		return {
			result: {
				errors: `[AartsHandler:processPayloadAsync] No manager present for type ${evnt.meta.item}!`
			}
		}
	}

	!process.env.DEBUGGER || loginfo({ringToken: evnt.meta.ringToken}, `[AartsHandler:processPayloadAsync] Will Invoke ${evnt.meta.item}:${evnt.meta.action} manager action`)

	const asyncGen = manager[evnt.meta.action](evnt)
	let processor
	do {
		processor = await asyncGen.next()
		!processor.done && (yield processor.value as string)
	} while (!processor.done)

	return {
		result: processor.value
	}
}