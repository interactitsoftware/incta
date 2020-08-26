/**
 * Converts an AppSyncEvent message an SQS received message for a sqs handler lambda.
 * Expects the AppSyncEvent message contents passed as a json, without new lines in it
 * Intended to be called from within an operating sns dispatcher lambda,
 *  when its running in the context of a sam local docker container (where sam is not present)
 * 
 */
import { prepareForDispatch } from './prepareForDispatch';

export const samLocalSimulateSQSHandlerFromContent = async (testEvent: string, ringToken: string) : Promise<string> => new Promise((resolve, reject) => {

  // note this script works with relative paths, according to the aarts context in which its called. corresponding folders should exeist
  const simulatedPayload = prepareForDispatch(JSON.parse(testEvent), ringToken)
  const sqsTemplate = JSON.parse(
`{
  "Records": [
    {
      "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
      "receiptHandle": "MessageReceiptHandle",
      "body": "Hello from SQS!",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1523232000000",
        "SenderId": "123456789012",
        "ApproximateFirstReceiveTimestamp": "1523232000001"
      },
      "messageAttributes": {},
      "md5OfBody": "7b270e59b47ff90a553787216d55d91d",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
      "awsRegion": "us-east-1"
    }
  ]
}`);

  sqsTemplate.Records[0].body = simulatedPayload.Message

  // need to double properties as there was a problem with SAM local not converting message attribute's props to start with lower case (in AWS its not needed)
  sqsTemplate.Records[0].messageAttributes = JSON.parse(lowerFirstLetter(simulatedPayload.MessageAttributes))

  console.log(JSON.stringify(sqsTemplate, null, 4))

  resolve(JSON.stringify(sqsTemplate).replace(/\r?\n|\r/g, ''));

});

const lowerFirstLetter = (obj: Record<string, any>) =>
  JSON.stringify(obj, function (key, value) {
    if (value && typeof value === 'object') {
      var replacement = {}
      for (var k in value) {
        if (Object.hasOwnProperty.call(value, k)) {
          //@ts-ignore
          replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k]
        }
      }
      return replacement
    }
    return value
  })