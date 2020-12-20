import { Context, SQSEvent } from "aws-lambda";

global.WebSocket = require('ws');
require('es6-promise').polyfill();
require('isomorphic-fetch');

export const feeder = async (event: SQSEvent, context: Context): Promise<any> => {
    console.log("appsync-feeder received event: " + JSON.stringify(event, undefined, 2));
    // console.log("process.env.APPSYNC_ENDPOINT_URL: " + process.env.APPSYNC_ENDPOINT_URL);
    // console.log("process.env.AWS_REGION: " + process.env.AWS_REGION);
    // console.log("process.env.AWS_ACCESS_KEY_ID: " + process.env.AWS_ACCESS_KEY_ID);
    // console.log("process.env.AWS_SECRET_ACCESS_KEY: " + process.env.AWS_SECRET_ACCESS_KEY);
    // console.log("process.env.AWS_SESSION_TOKEN: " + process.env.AWS_SESSION_TOKEN);

    const AWSAppSyncClient = require('aws-appsync').default

    const gql = require('graphql-tag');

    const client = new AWSAppSyncClient({
        url: process.env.APPSYNC_ENDPOINT_URL as string,
        region: process.env.AWS_REGION as string,
        auth: {
            type: 'AWS_IAM',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
                sessionToken: process.env.AWS_SESSION_TOKEN as string
            }
        },
        disableOffline: true
    });

    if (event["Records"] && event["Records"].length > 0) {
        for (var i = 0; i < event["Records"].length; i++) {
            var record = event["Records"][i];

            var message = JSON.parse(record["body"]);
            !process.env.DEBUGGER || console.log("Message is " + record["body"]);
            !process.env.DEBUGGER || console.log("----------------------");
            !process.env.DEBUGGER || console.log("item", `${record.messageAttributes["item"].stringValue as string}`)
            !process.env.DEBUGGER || console.log("action", `${record.messageAttributes["action"].stringValue as string}`)
            !process.env.DEBUGGER || console.log("identity", JSON.stringify(message.payload && message.payload.identity || "backend"))
            !process.env.DEBUGGER || console.log("ringToken", `${record.messageAttributes["ringToken"].stringValue as string}`)
            !process.env.DEBUGGER || console.log("eventSource", `${record.messageAttributes["eventSource"].stringValue as string}`)
            !process.env.DEBUGGER || console.log("body", JSON.stringify(message.payload.arguments || message))
            !process.env.DEBUGGER || console.log("----------------------");

            const mutation = gql`mutation Notification($item: String!, $action: String!, $identity: String!, $ringToken: String!, $eventSource: String!, $body: String!) {
    feed(item: $item, action: $action, identity: $identity, ringToken: $ringToken, eventSource: $eventSource, body: $body)
    {
        item
        action
        identity
        ringToken
        eventSource
        body
        sentAt
    }
}`;
            await client.mutate({
                mutation, fetchPolicy: 'no-cache', variables: {
                    "item": `${record.messageAttributes["item"].stringValue as string}`,
                    "action": `${record.messageAttributes["action"].stringValue as string}`,
                    "ringToken": `${record.messageAttributes["ringToken"].stringValue as string}`,
                    "eventSource": `${record.messageAttributes["eventSource"].stringValue as string}`,
                    "identity": JSON.stringify(message.payload && message.payload.identity || "backend"),
                    "body": JSON.stringify(message.payload.arguments || message),
                }
            })
                .then(function logData(data) {
                    !process.env.DEBUGGER || console.log('results of mutation: ', data);
                })
                .catch(console.error);
        }
    }
}