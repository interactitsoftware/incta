import { Context } from "aws-lambda"
import { AartsEvent } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"
import { processPayloadAsync } from 'aarts-handler/aartsHandler'
import { AartsEBUtil } from 'aarts-eb-types/aartsEBUtil'

export const handler = async (input: AartsEvent, context: Context): Promise<any> => {
	process.env.DEBUG || console.log('received AartsPayload: ', input)

	return await new AartsSqsHandler().processPayload(input, context)
}

export class AartsSqsHandler extends AartsEBUtil {

	async processPayload(input: AartsEvent, context: Context): Promise<any> {

		return new Promise(async (resolve: any, reject: any) => {

			const asyncGen = processPayloadAsync(input)

			let processor = await asyncGen.next()
			do {
				if (!processor.done) {
					processor = await asyncGen.next()
					process.env.DEBUG || console.log(`[${input.meta.item}:${input.meta.action}] `, ppjson(processor.value))
					await this.publish(this.preparePublishInput(processor.value));
				}
			} while (!processor.done)

			resolve(processor.value)
		})
	}
	private preparePublishInput = (processedBusEvent: AartsEvent): AWS.SNS.PublishInput => {
		return {
			Message: JSON.stringify(processedBusEvent.payload.arguments),
			MessageAttributes: {
				"eventSource": {
					DataType: 'String',
					StringValue: `worker:output:${processedBusEvent.meta.action}`,
				},
				"action": { 
					DataType: 'String',
					StringValue: `${processedBusEvent.meta.action}`,
				},
				"item": {
					DataType: 'String',
					StringValue: processedBusEvent.meta.item
				},
				"ringToken": {
					DataType: 'String',
					StringValue: processedBusEvent.meta.ringToken
				}
			}
		}
	}
}
