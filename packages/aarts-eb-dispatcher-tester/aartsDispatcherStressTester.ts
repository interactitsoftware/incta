import { Context } from "aws-lambda";
import AWS = require("aws-sdk");
import {AartsEBUtil, AppSyncEvent} from "aarts-eb-types/aartsEBUtil"

class AartsDispatcherStressTester extends AartsEBUtil {

	constructor() {
		super()
	}

	public dispatch = async (event: AppSyncEvent, context: Context): Promise<any> => {
		console.log('received event: ', event)

		const domainItems = Object.keys(global.domainAdapter.itemManagers)
		// TODO: also fire for update and delete
		// TODO: const domainProcedures = Object.keys(domainAdapter.procedures)
		const ringTokens = []
		const publishings = []
		for (let i = 0; i < Number((event.arguments.nrEvents) || 100); i++) {
			const ringToken: string = this.uuid()
			ringTokens.push(ringToken);
			const publishInput: AWS.SNS.PublishInput = {
				Message: JSON.stringify({payload: {arguments: event.arguments, identity: event.identity}}),
				MessageAttributes: {
					"eventSource": {
						DataType: 'String',
						StringValue: `worker:input`
					},
					"action": {
						DataType: 'String',
						StringValue: `${event.action}`
					},
					"item": {
						DataType: 'String',
						StringValue: `${domainItems[i%(domainItems.length)]}`
					},
					"ringToken": {
						DataType: 'String',
						StringValue: ringToken
					}
				}
			}
			publishings.push(this.publish(publishInput))
		}
		
		await Promise.all(publishings) 

		return {
			statusCode: 200,
			body: { ...event.arguments, ringTokens }
		}
	}
}

export const handler = new AartsDispatcherStressTester().dispatch