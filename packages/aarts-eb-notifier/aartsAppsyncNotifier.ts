//@ts-nocheck

import { Context, SQSEvent } from "aws-lambda";
import appsync = require('aws-appsync');
const gql = require('graphql-tag');
require('cross-fetch/polyfill');

export const handler = async (event: SQSEvent, context: Context): Promise<any> => {
    console.log("appsync-notifier function received event: " + JSON.stringify(event, undefined, 2));
    //console.log("process.env.APPSYNC_ENDPOINT_URL: " + process.env.APPSYNC_ENDPOINT_URL);
    //console.log("process.env.AWS_REGION: " + process.env.AWS_REGION);
    //console.log("process.env.AWS_ACCESS_KEY_ID: " + process.env.AWS_ACCESS_KEY_ID);
    //console.log("process.env.AWS_SECRET_ACCESS_KEY: " + process.env.AWS_SECRET_ACCESS_KEY);
    //console.log("process.env.AWS_SESSION_TOKEN: " + process.env.AWS_SESSION_TOKEN);

    const graphqlClient = new appsync.AWSAppSyncClient({
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
             console.log("Message is " + record["body"]);
             console.log("----------------------");
             console.log( "item", `${record.messageAttributes["item"].stringValue as string}`)
             console.log( "action", `${record.messageAttributes["action"].stringValue as string}`)
             console.log( "identity", JSON.stringify(message.payload.identity))
             console.log( "ringToken",  `${record.messageAttributes["ringToken"].stringValue as string}`)
             console.log( "eventSource", `${record.messageAttributes["eventSource"].stringValue as string}`)
             console.log( "body", JSON.stringify(message.payload.arguments || message))
             console.log("----------------------");
            
            //, from: "EVENT_BUS", sentAt: "now" <--additional attributes removed from mutation as they come from the appsync resolver
            const mutation = gql`mutation Notification($item: String!, $action: String!, $identity: String!, $ringToken: String!, $eventSource: String!, $body: String!) {
    notify(item: $item, action: $action, identity: $identity, ringToken: $ringToken, eventSource: $eventSource, body: $body)
    {
        body
        eventSource
        ringToken
        item
        action
        identity
        sentAt
    }
}`;
            var a = await graphqlClient.mutate({
                mutation,
                variables: {
                    "item": `${record.messageAttributes["item"].stringValue as string}`,
                    "action": `${record.messageAttributes["action"].stringValue as string}`,
                    "ringToken":  `${record.messageAttributes["ringToken"].stringValue as string}`,
                    "eventSource": `${record.messageAttributes["eventSource"].stringValue as string}`,
                    "identity": JSON.stringify(message.payload.identity),
                    "body": JSON.stringify(message.payload.arguments || message),
                    // "body": Buffer.from(record["body"]).toString('base64'),
                }
            });
            console.log("after mutating ", a);
        }

    }
}
