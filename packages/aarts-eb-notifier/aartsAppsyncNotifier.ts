//@ts-nocheck

import { Context, SQSEvent } from "aws-lambda";
import appsync = require('aws-appsync');
const gql = require('graphql-tag');
require('cross-fetch/polyfill');

export const handler = async (event: SQSEvent, context: Context): Promise<any> => {
    //console.log("appsync-notifier 17 function received event: " + JSON.stringify(event, undefined, 2));
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
            // console.log("Message is " + record["body"]);
            var message = JSON.parse(record["body"]);

            //, from: "EVENT_BUS", sentAt: "now" <--additional attributes removed from mutation as they come from the appsync resolver
            const mutation = gql`mutation Notification($to: String!, $body: String!) {
    notify(to: $to, body: $body)
    {
        body
        to
        from
        sentAt
    }
}`;
            var a = await graphqlClient.mutate({
                mutation,
                variables: {
                    "to": `${record.messageAttributes["eventSource"].stringValue as string}:${record.messageAttributes["item"].stringValue as string}`,
                    "body": JSON.stringify(message.payload.arguments || message),
                    // "body": Buffer.from(record["body"]).toString('base64'),
                }
            });
            // console.log("after mutating ", a);
        }

    }
}
