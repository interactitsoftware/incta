import { AppSyncEvent } from "./aartsEBUtil"

export const prepareAppSyncEventForDispatch = (event: AppSyncEvent, ringToken: string) => {
	return {
		Message: JSON.stringify({payload: event}),
		// Message: JSON.stringify({payload: {arguments: event.arguments, identity: event.identity}}),
		MessageAttributes: {
			"eventSource": {
				DataType: 'String',
				// defaults should be fire an "input", with "s" worker type;
				StringValue: `worker:${event.eventType === "output" ? "output" : "input"}:${event.jobType === "long"? "long" : "short"}`
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