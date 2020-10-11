import * as AWS from "aws-sdk";


export interface AppSyncEvent {
    action: string,
    item: string,
    ringToken?: string,
    arguments: any,
    identity: any,
    jobType?: "long" | "short" | undefined
    eventType?: "input" | "output" | undefined
    selectionSetList?: string | undefined
    selectionSetGraphQL?: string | undefined
}

/**
 * @param message to publish
 * @returns {Promise} AWS.Error | AWS.SNS.PublishResponse
 * @description
 * Promise wrapped AWS.publish
 */
export const publish = async (message: AWS.SNS.PublishInput): Promise<AWS.AWSError | AWS.SNS.PublishResponse> => {
    return new Promise((resolve: Function, reject: Function) => {
        const topicArn: string | undefined = process.env.EVENT_BUS_TOPIC;
        if (!topicArn) { reject("[Error] No Topic ARN specified"); }

        const region: string | undefined = validateTopicArn(topicArn as string);
        if (region) { reject("[Error] Invalid Topic ARN"); }

        // Specified region because unable to send if the region is different from AWS Lambda
        const sns: AWS.SNS | typeof localMockSNSFile = process.env["AWS_SAM_LOCAL"] ? localMockSNSFile : new AWS.SNS({ region: region });
        let snsParams: AWS.SNS.PublishInput = Object.assign(message, { TopicArn: topicArn });
        sns.publish(snsParams, (err: AWS.AWSError, data: AWS.SNS.PublishResponse) => {
            err ? reject(err) : resolve(data);
        });
    });
}

const validateTopicArn = (topicArn: string): string | undefined => {
    let splitedTopicArn: string[] = (topicArn as string).split(":");
    if (splitedTopicArn.length < 7) { return undefined; }
    return splitedTopicArn[3];
}


/**
 * Used in local SAM testing and development
 */
const localMockSNSFile = class {
    static publish(publishInput: AWS.SNS.PublishInput, cb: Function) {
        console.log("--->MOCK SNS/MESSAGE START", publishInput, "<---MOCK SNS/MESSAGE END")
        cb()
        //return new Promise((resolve, reject) => writeFile('sns.publish', publishInput, cb as NoParamCallback))
    }
}

// caution, if you need delays, probably there is something else to be done better
// protected async delay(result: any, ms: number): Promise<{ [key: string]: any }> {
//     return new Promise(resolve => setTimeout(() => resolve(result), ms));
// }








