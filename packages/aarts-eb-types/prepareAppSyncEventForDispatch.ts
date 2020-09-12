import { AppSyncEvent } from "./aartsEBUtil"

export const prepareAppSyncEventForDispatch = (event: AppSyncEvent, ringToken: string) => {
	return {
		Message: JSON.stringify({payload: {arguments: event.arguments, identity: event.identity}}),
		MessageAttributes: {
			"eventSource": {
				DataType: 'String',
				// defaults should be fire an "input", with "s" worker type;
				StringValue: `worker:${event.messageType === "output" ? "output" : "input"}:${event.taskType === "l"? "l" : "s"}`
			},
			"action": {
				DataType: 'String',
				StringValue: `${event.action}`
			},
			"item": {
				DataType: 'String',
				StringValue: `${event.item}`
			},
			"ringToken": {
				DataType: 'String',
				StringValue: ringToken
			}
		}
	}
}