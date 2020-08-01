import { Context } from "aws-lambda"
import { IItemManager, AartsPayload, AartsEvent } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"

export const handler = async (input: AartsEvent, context: Context): Promise<any> => {
	process.env.DEBUG && console.log('received AartsEvent: ', input)

	return await processPayload(input, context)
}

export async function processPayload(input: AartsEvent, context: Context): Promise<any> {

	return new Promise(async (resolve: any, reject: any) => {

		const asyncGen = processPayloadAsync(input)

		let processor = await asyncGen.next()
		do {
			if (!processor.done) {
				processor = await asyncGen.next()
				process.env.DEBUG && console.log(`[${input.meta.item}:${input.meta.action}] `, ppjson(processor.value))
			}
		} while (!processor.done)

		resolve(processor.value)
	})
}

export async function* processPayloadAsync(input: AartsEvent): AsyncGenerator<AartsEvent, AartsEvent, undefined> {

	process.env.DEBUG && (yield Object.assign({}, input, { payload: { arguments: `[AartsHandler:processPayloadAsync] Checking item manager for type ${input.meta.item}` } }))

	const domainArguments = Array.isArray(input.payload.arguments) ? input.payload.arguments : [input.payload.arguments]

	const payloadsArray = {
		arguments: domainArguments,
		identity: input.payload.identity,
		ringToken: input.meta.ringToken
	}

	process.env.DEBUG && (yield Object.assign({}, input, { payload: { arguments: `[AartsHandler:processPayloadAsync] Will Invoke ${input.meta.item}:${input.meta.action} manager action` } }))

	let resultItems = []
	// try {
	const manager = global.domainAdapter.itemManagers[input.meta.item] as unknown as IItemManager<object>;
	if (!manager) {
		return Object.assign({}, input,
			{
				payload: {
					arguments: {
						topic: input.meta.item,
						errors: `[AartsHandler:processPayloadAsync] No manager present for type ${input.meta.item}!`
					}
				}
			})
	}
	const asyncGen = manager[input.meta.action](input.meta.item, payloadsArray)
	let processor = await asyncGen.next()
	do {
		if (!processor.done) {
			yield Object.assign({}, input, { payload: { arguments: processor.value.arguments } })
			processor = await asyncGen.next()
		}
	} while (!processor.done)

	resultItems = processor.value.arguments

	return Object.assign(input, {
		resultItems
	})
	// LEAVE HANDLER TO FAIL LOUDLY, so that sqs/lambda retry mechanism kicks in
	// } catch (error) {
	// 	return Object.assign({}, input,
	// 		{
	// 			payload: {
	// 				arguments: {
	// 					topic: input.meta.item,
	// 					errors: error.message
	// 				}
	// 			}
	// 		})
	// }
}