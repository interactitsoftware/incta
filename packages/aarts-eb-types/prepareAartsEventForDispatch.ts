import { AartsEvent } from "aarts-types/interfaces"

export const prepareAartsEventForDispatch = (processedBusEvent: AartsEvent): AWS.SNS.PublishInput => {
	return {
		Message: JSON.stringify(processedBusEvent),
		MessageAttributes: {
			"eventSource": {
				DataType: 'String',
				// defaults should be fire an "output", with "s" worker type; because its "output" this already lends to the notifier worker who does nto care about s/l
				StringValue: `worker:${processedBusEvent.eventType === "input"? "input" : "output"}:${processedBusEvent.eventType === "input" ? processedBusEvent.jobType === "long" ? "long" : "short" : ""}`,
			},
			"jobType": {
				DataType: 'String',
				StringValue: `${processedBusEvent.jobType === "long"? "long" : "short"}`,
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