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
export const controller = async (evnt: AppSyncEvent, context?: Context, callback?: Function): Promise<any> => {
	
	const ringToken: string = (evnt as { ringToken: string }).ringToken || uuid()
	// log the ringToken
	if (!!evnt.ringToken) {
		!process.env.DEBUGGER || loginfo({ ringToken }, `using already present ring token:  ${ringToken} for received event`, ppjson(evnt))
	} else {
		!process.env.DEBUGGER || loginfo({ ringToken }, `generated ring token: ${ringToken} for received event`, ppjson(evnt))
	}

	if ("triggerSource" in evnt && evnt["triggerSource"] === "PostAuthentication_Authentication") {
		// catch events of payload:
		//{ "version": "1", "region": "eu-west-1", "userPoolId": "eu-west-1_5fFubCk74", "userName": "76c46c18-0aa8-4786-a1eb-ae50b880f7f7", "callerContext": { "awsSdkVersion": "aws-sdk-unknown-unknown", "clientId": "5og3ldap1shskk164029tg9a8s" }, "triggerSource": "PostAuthentication_Authentication", "request": { "userAttributes": { "sub": "76c46c18-0aa8-4786-a1eb-ae50b880f7f7", "email_verified": "true", "cognito:user_status": "FORCE_CHANGE_PASSWORD", "email": "akrsmv@gmail.com" }, "newDeviceUsed": false }, "response": {} }
		!process.env.DEBUGGER || loginfo({ ringToken }, `PostAuthentication_Authentication event`, ppjson(evnt))
		// TODO excerpt in separate npm package
		!!callback && callback(null, evnt)
	}

	if ("triggerSource" in evnt && evnt["triggerSource"] === "TokenGeneration_Authentication") {
		// catch events of payload:
		//{ "version": "1", "triggerSource": "TokenGeneration_Authentication", "region": "eu-west-1", "userPoolId": "eu-west-1_5fFubCk74", "userName": "76c46c18-0aa8-4786-a1eb-ae50b880f7f7", "callerContext": { "awsSdkVersion": "aws-sdk-unknown-unknown", "clientId": "5og3ldap1shskk164029tg9a8s" }, "request": { "userAttributes": { "sub": "76c46c18-0aa8-4786-a1eb-ae50b880f7f7", "email_verified": "true", "cognito:user_status": "FORCE_CHANGE_PASSWORD", "email": "akrsmv@gmail.com" }, "groupConfiguration": { "groupsToOverride": [], "iamRolesToOverride": [], "preferredRole": null } }, "response": { "claimsOverrideDetails": null } }
		!process.env.DEBUGGER || loginfo({ ringToken }, `PostAuthentication_Authentication event`, ppjson(evnt))
		// TODO excerpt in separate npm package
		!!callback && callback(null, evnt)
	}

	!process.env.DEBUGGER || loginfo({ ringToken }, ppjson(process.env))

	let result
	if (!!evnt.action) {
		result = await processAppSyncEvent(evnt, ringToken, context)
	} else {
		//assume an unknown event
		throw new Error(`Unknown event landed in arrtsSNSEventDispatcher: ${ppjson(evnt)}`)
	}

	return Object.assign(result, { ringToken }) 
}

const processAppSyncEvent = async (evnt: AppSyncEvent, ringToken: string, context?: Context) => {
	const syncProcessing =
		(evnt.action === "query" || evnt.action === "get")// always process sync GET requests
		|| (evnt.action !== "start" // always process async START(RPC) requests
			&& !process.env.ASYNC_CUD && !evnt.forcePublishToBus); // process CUD requests depending on config
	let result;
	if (syncProcessing) {
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
			FunctionName: evnt.jobType === "long" ? process.env.WORKER_LONG as string : process.env.WORKER_SHORT as string,
			Payload: sqsEvent
		}, (err, data) => {
			console.log("[AWS_SAM_LOCAL]: SNS DISPATCHER PROCESSED EVENT " + sqsEvent)
		}).promise()
}


