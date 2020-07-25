import { Context } from "aws-lambda";
import AWS = require("aws-sdk");
import {AartsEBUtil, AppSyncEvent} from "aarts-eb-types/aartsEBUtil"
import { prepareForDispatch } from "./prepareForDispatch";

/**
 * forwards to SNS, decorating with:
 * - eventSource = worker:input
 * - ringToken = uuid()
 */
class aartsSnsDispatcher extends AartsEBUtil {

	constructor() {
		super()
	}

	public dispatch = async (event: AppSyncEvent, context?: Context): Promise<any> => {
		console.log('received event: ', event)
		
		const ringToken : string = this.uuid()
		const publishInput: AWS.SNS.PublishInput = prepareForDispatch(event, ringToken)

		await this.publish(publishInput)
	
		return {
			statusCode: 200,
			body: {...event.arguments, ringToken}
		}
	} 
}

export const handler = new aartsSnsDispatcher().dispatch