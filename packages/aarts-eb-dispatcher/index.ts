import { Context, DynamoDBStreamEvent } from "aws-lambda";
import AWS = require("aws-sdk");
import { publish, AppSyncEvent } from "aarts-eb-types"
import { samLocalSimulateSQSHandlerFromContent } from "./samLocalSimulateSQSHandlerFromContent";
import { processPayload } from "aarts-handler/aartsHandler"
import { prepareAppSyncEventForDispatch } from "aarts-eb-types/prepareAppSyncEventForDispatch"
import { loginfo, ppjson, uuid } from "aarts-utils";
import { IItemManagerKeys } from "aarts-types/interfaces";

/**
 * forwards to SNS, decorating with:
 * - eventSource = worker:input
 * - ringToken = uuid()
 * If invoked in the context of SAM LOCAL it will call the sqs handler synchronously, skiping the SNS publish part
 */
export const controller = async (evnt: AppSyncEvent, context?: Context): Promise<any> => {
	const ringToken: string = (evnt as { ringToken: string }).ringToken || uuid()
	// log the ringToken
	if (!!evnt.ringToken) {
		!process.env.DEBUGGER || loginfo({ ringToken }, `using already present ring token:  ${ringToken} for received event`, ppjson(evnt))
	} else {
		!process.env.DEBUGGER || loginfo({ ringToken }, `generated ring token: ${ringToken} for received event`, ppjson(evnt))
	}

	let result
	if (!!evnt.action) {
		result = await processAppSyncEvent(evnt, ringToken, context)
	} else {
		//assume an unknown event
		throw new Error(`Unknown event landed in arrtsSNSEventDispatcher: ${ppjson(evnt)}`)
	}

	return result
}

const processAppSyncEvent = async (evnt: AppSyncEvent, ringToken: string, context?: Context) => {

	let result
	if (evnt.action === "query" || evnt.action === "get") {
		!process.env.DEBUGGER || loginfo({ ringToken }, 'dispatching directly to handler, skipping SNS publishing. evnt is ', ppjson(evnt))
			Object.assign(evnt.arguments, { selectionSetGraphQL: evnt.selectionSetGraphQL, selectionSetList: evnt.selectionSetList })
		return (await processPayload({
			meta: {
				ringToken: ringToken,
				eventSource: `worker:${evnt.eventType === "output" ? evnt.eventType : "input"}:${evnt.jobType}`,
				action: evnt.action as IItemManagerKeys,
				item: evnt.item
			},
			payload: {
				arguments: evnt.arguments,
				identity: evnt.identity,
			}
		}, context)).result
	} else if (!process.env["AWS_SAM_LOCAL"]) {
		// used runtime in aws
		const publishInput: AWS.SNS.PublishInput = prepareAppSyncEventForDispatch(evnt, ringToken)
		result = await publish(publishInput)
		// PROD runtime execution ends here

	} else {
		// try calling synchronously a worker, simulating sqs event
		// result = await samLocalSupport_callSqsHandlerSynchronously(event, ringToken)
		
		// within the same lamnbda, process the payload
		result = (await processPayload({
			meta: {
				ringToken: ringToken,
				eventSource: `worker:${evnt.eventType === "output" ? evnt.eventType : "input"}:${evnt.jobType}`,
				action: evnt.action as IItemManagerKeys,
				item: evnt.item
			},
			payload: {
				arguments: evnt.arguments,
				identity: evnt.identity,
			}
		}, context)).result
	}

	return result
}

const samLocalSupport_callSqsHandlerSynchronously = async (evnt: AppSyncEvent, ringToken: string) => {
	//used sam local runtime
	const sqsEvent = await samLocalSimulateSQSHandlerFromContent(JSON.stringify(evnt), ringToken);
	!process.env.DEBUGGER || loginfo({ ringToken }, "AWS_SAM_LOCAL INVOCATION. INVOKING SYNCHRONOUSLY SQS HANDLER")
	!process.env.DEBUGGER || loginfo({ ringToken }, "AWS_SAM_LOCAL INVOCATION. SQS WORKER SHORT IS " + process.env.WORKER_SHORT)
	!process.env.DEBUGGER || loginfo({ ringToken }, "AWS_SAM_LOCAL INVOCATION. SQS WORKER LONG IS " + process.env.WORKER_LONG)
	!process.env.DEBUGGER || loginfo({ ringToken }, "sqsEVENT simulated: ", sqsEvent)

	// only run inside local lambda runner
	// Note the endpoint name
	var lambda = new AWS.Lambda({
		endpoint: 'host.docker.internal:3001',
		// endpoint: 'samcliproxy.example.com:3001', not working, 
		// chekout: https://docs.docker.com/docker-for-mac/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host
		// and: https://github.com/awslabs/aws-sam-cli/issues/510#issuecomment-554687309

		sslEnabled: false,
		// is it because a lambda should return some standard output ({status_code : 200 } etc), 
		// that even a succesful lambda in aws, retries with SAM LOCAL (if set maxRetries is > 1)
		maxRetries: 1, 
		retryDelayOptions: {
			customBackoff: (retryCount: number, err) => {
				!process.env.DEBUGGER || loginfo({ ringToken }, new Date() + ": retrying attempt:" + retryCount + ". ERROR ", ppjson(err))
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
			FunctionName: evnt.jobType === "long" ? process.env.WORKER_LONG as string: process.env.WORKER_SHORT as string,
			Payload: sqsEvent
		}, (err, data) => {
			console.log("[AWS_SAM_LOCAL]: SNS DISPATCHER PROCESSED EVENT " + sqsEvent)
		}).promise()
}


