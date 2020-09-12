import { AartsEvent } from "aarts-types/interfaces"

export const prepareAartsEventForDispatch = (processedBusEvent: AartsEvent): AWS.SNS.PublishInput => {
	return {
		Message: JSON.stringify(processedBusEvent.payload.arguments),
		MessageAttributes: {
			"eventSource": {
				DataType: 'String',
				// defaults should be fire an "output", with "s" worker type; because its "output" this already lends to the notifier worker who does nto care about s/l
				StringValue: `worker:${processedBusEvent.resultType === "input"? "input" : "output"}:${processedBusEvent.taskType === "l"? "l" : "s"}:${processedBusEvent.meta.action}`,
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