import { Context } from "aws-lambda";
import AWS = require("aws-sdk");
import { AartsEBUtil, AppSyncEvent } from "aarts-eb-types/aartsEBUtil"
import { prepareForDispatch } from "./prepareForDispatch";
import { samLocalSimulateSQSHandler } from "./samLocalSimulateHandlerFromContent";

/**
 * forwards to SNS, decorating with:
 * - eventSource = worker:input
 * - ringToken = uuid()
 * If invoked in the context of SAM LOCAL it will call the sqs handler synchronously, skiping the SNS publish part
 */
class aartsSnsDispatcher extends AartsEBUtil {

	constructor() {
		super()
	}

	public dispatch = async (event: AppSyncEvent, context?: Context): Promise<any> => {

		const ringToken: string = this.uuid()
		console.log('generated ring token: ' + ringToken + ' for received event: ', event)

		if (!process.env["AWS_SAM_LOCAL"]) {
			// used runtime in aws
			const publishInput: AWS.SNS.PublishInput = prepareForDispatch(event, ringToken)
			await this.publish(publishInput)
			// PROD runtime execution ends here

		} else {
			this.samLocalSupport_callSqsHandlerSynchronously(event, ringToken)
		}

		return {
			statusCode: 200,
			body: { ...event.arguments, ringToken }
		}
	}

	public async samLocalSupport_callSqsHandlerSynchronously(event: AppSyncEvent, ringToken: string) {
		//used sam local runtime
		const sqsEvent = await samLocalSimulateSQSHandler(JSON.stringify(event), ringToken);
		process.env.DEBUG && console.log("AWS_SAM_LOCAL INVOCATION. INVOKING SYNCHRONOUSLY SQS HANDLER")
		process.env.DEBUG && console.log("sqsEVENT simulated: " + sqsEvent)

		// only run inside local lambda runner
		// Note the endpoint name
		var lambda = new AWS.Lambda({
			endpoint: 'host.docker.internal:3001',
			// endpoint: 'samcliproxy.example.com:3001', not working, 
			// chekout: https://docs.docker.com/docker-for-mac/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host
			// and: https://github.com/awslabs/aws-sam-cli/issues/510#issuecomment-554687309

			sslEnabled: false,
			maxRetries: 2,
			retryDelayOptions: {
				customBackoff: (retryCount: number, err) => {
					process.env.DEBUG && console.log(new Date() + ": retrying attempt:" + retryCount + ". ERROR " + JSON.stringify(err, null, 4))
					// expecting to retry
					// 1st attempt: 110 ms
					// 2nd attempt: 200 ms
					// 3rd attempt: 1300 ms

					return 100 ^ (retryCount / 2) + (retryCount / 2) * 200;
				}
			}
		})


		// IMPORTANT we dont want retry on a dispatcher level, only on sqs handler level
		// because if dispatcher reties, it will generate new ringToken, which may result in duplicate items, out of single create events (which got failed, and retried)
		// this consideration is reflacted in cdk definition of the dispatcher and this is how it will behave in AWS runtime
		// however here, if the synchronous invocation fails dispatcher will DO retry (SAM local limitation?) 
		await lambda.invoke(
			{
				FunctionName: process.env.AARTS_SQS_HANDLER as string,
				Payload: sqsEvent
			}, (err, data) => {
				console.log("[AWS_SAM_LOCAL]: SNS DISPATCHER PROCESSED EVENT " + sqsEvent)
			}).promise()
	}
}

export const handler = new aartsSnsDispatcher().dispatch