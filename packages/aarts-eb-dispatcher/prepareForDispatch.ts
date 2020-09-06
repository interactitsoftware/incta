export const prepareForDispatch = (event: {
    action: string,
    item: string,
    arguments: any,
    identity: any
}, ringToken: string) => {
	return {
		Message: JSON.stringify({payload: {arguments: {...(event.arguments), ringToken}, identity: event.identity}}),
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
				StringValue: `${event.item}`
			},
			"ringToken": {
				DataType: 'String',
				StringValue: ringToken
			}
		}
	}
}