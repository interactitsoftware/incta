// import { AppSyncEvent } from "aarts-eb-types/aartsEBUtil"

// export const prepareForDispatch = (event: AppSyncEvent, ringToken: string) => {
// 	return {
// 		Message: JSON.stringify({payload: {arguments: event.arguments, identity: event.identity}}),
// 		MessageAttributes: {
// 			"eventSource": {
// 				DataType: 'String',
// 				StringValue: `worker:${event.taskType || "s"}:${event.messageType || "input"}`
// 			},
// 			"action": {
// 				DataType: 'String',
// 				StringValue: `${event.action}`
// 			},
// 			"item": {
// 				DataType: 'String',
// 				StringValue: `${event.item}`
// 			},
// 			"ringToken": {
// 				DataType: 'String',
// 				StringValue: ringToken
// 			}
// 		}
// 	}
// }