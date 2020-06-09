import {exec}  from 'child_process'
import { prepareForDispatch } from './prepareForDispatch';

export const samLocalSimulateSQSHandler = async (testEvent: string) => new Promise((resolve, reject) => {
    let cmd = 'sam local generate-event sqs receive-message';

    exec(cmd, {}, function (err, sqsEventTemplate, stderr) {
        if (err) return reject(stderr);
        
        const simulatedPayload = prepareForDispatch(require(`../../../../infra/test/test-events/eventDispatcher/${testEvent}.json`), "myFakeLocalCorrelationToken")
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