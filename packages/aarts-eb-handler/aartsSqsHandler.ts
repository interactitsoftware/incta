import { Context, SQSEvent } from "aws-lambda"
import { AartsEvent, IItemManagerKeys } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"
import { processPayloadAsync } from 'aarts-handler/aartsHandler'
import { AartsEBUtil } from 'aarts-eb-types/aartsEBUtil'
import { prepareAartsEventForDispatch } from 'aarts-eb-types/prepareAartsEventForDispatch'


export const handler = async (message: SQSEvent, context: Context): Promise<any> => {
	!process.env.DEBUGGER || console.log('received SQS message: ', ppjson(message))
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
		!process.env.DEBUGGER || console.log('parsed aartsEvent from SQS is ', aartsEvent)
		process.env.ringToken = aartsEvent.meta.ringToken
		await new AartsSqsHandler().processPayload(aartsEvent, context)
	}
}

export class AartsSqsHandler extends AartsEBUtil {

	async processPayload(input: AartsEvent, context?: Context): Promise<any> {

		const asyncGen = processPayloadAsync(input)

		let processor = await asyncGen.next()
		do {
			if (!processor.done) {
				processor = await asyncGen.next()
				!process.env.DEBUGGER || console.log(`[${input.meta.item}:${input.meta.action}] `, ppjson(processor.value))
				await this.publish(prepareAartsEventForDispatch(processor.value))

			}
		} while (!processor.done)

		return processor.value
	}
}
