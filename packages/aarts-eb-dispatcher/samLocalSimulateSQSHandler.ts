/**
 * Converts an AppSyncEvent message an SQS received message for a sqs handler lambda.
 * Expects a file path holding the AppSyncEvent contents
 */
import {exec}  from 'child_process'
import { prepareAppSyncEventForDispatch } from 'aarts-eb-types/prepareAppSyncEventForDispatch';

export const samLocalSimulateSQSHandler = async (testEvent: string) => new Promise((resolve, reject) => {
    let cmd = 'sam local generate-event sqs receive-message';

    exec(cmd, {}, function (err, sqsEventTemplate, stderr) {
        if (err) return reject(stderr);
        // note this script works with relative paths, according to the aarts context in which its called. corresponding folders should exeist
        const simulatedPayload = prepareAppSyncEventForDispatch(require(`${testEvent}`), `${Date.now()}_${Math.random()*1000000}`)
        const sqsTemplate = JSON.parse(sqsEventTemplate)

        sqsTemplate.Records[0].body = simulatedPayload.Message

        // need to double properties as there was a problem with SAM local not converting message attribute's props to start with lower case (in AWS its not needed)
        sqsTemplate.Records[0].messageAttributes = JSON.parse(lowerFirstLetter(simulatedPayload.MessageAttributes))
        
        console.log(JSON.stringify(sqsTemplate, null, 4))

        resolve(`'${sqsTemplate}'`);
       
    });
})

const lowerFirstLetter = (obj: Record<string,any>) =>
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


samLocalSimulateSQSHandler(process.argv[2])