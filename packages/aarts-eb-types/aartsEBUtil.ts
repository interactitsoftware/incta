import AWS from "aws-sdk";
import * as idGenUtil from 'aarts-types/utils'

export interface AppSyncEvent {
    action: string,
    item: string,
    arguments: any,
    identity: any
}
const localMockSNSFile = class {
    static publish(publishInput: AWS.SNS.PublishInput, cb: Function) {
        console.log("--->MOCK SNS/MESSAGE START",publishInput,"<---MOCK SNS/MESSAGE END")
        cb()
        //return new Promise((resolve, reject) => writeFile('sns.publish', publishInput, cb as NoParamCallback))
    }
}

/**
 * Has nethods for publishing to SNS topic
 */
export class AartsEBUtil {

    // protected async delay(result: any, ms: number): Promise<{ [key: string]: any }> {
    //     return new Promise(resolve => setTimeout(() => resolve(result), ms));
    // }

    protected uuid = (): string => {
        // if custom ring tokens needed build on top of contracts.uuid
        return idGenUtil.uuid();
    }

    /**
     * @param message to publish
     * @returns {Promise} AWS.Error | AWS.SNS.PublishResponse
     * @description
     * Promise wrapped AWS.publish
     */
    protected publish(message: AWS.SNS.PublishInput): Promise<AWS.AWSError | AWS.SNS.PublishResponse> {
        return new Promise((resolve: Function, reject: Function) => {
            const topicArn: string | undefined = process.env.EVENT_BUS_TOPIC;
            if (!topicArn) { reject("[Error] No Topic ARN specified"); }

            const region: string | undefined = this.validateTopicArn(topicArn as string);
            if (region) { reject("[Error] Invalid Topic ARN"); }

            // Specified region because unable to send if the region is different from AWS Lambda
            const sns: AWS.SNS | typeof localMockSNSFile = process.env["AWS_SAM_LOCAL"] ? localMockSNSFile : new AWS.SNS({ region: region });
            let snsParams: AWS.SNS.PublishInput = Object.assign(message, { TopicArn: topicArn });
            sns.publish(snsParams, (err: AWS.AWSError, data: AWS.SNS.PublishResponse) => {
                err ? reject(err) : resolve(data);
            });
        });
    }

    private validateTopicArn(topicArn: string): string | undefined {
        let splitedTopicArn: string[] = (topicArn as string).split(":");
        if (splitedTopicArn.length < 7) { return undefined; }
        return splitedTopicArn[3];
    }
}


