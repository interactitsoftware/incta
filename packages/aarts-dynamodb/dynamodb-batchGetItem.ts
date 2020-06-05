'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { AWSError } from 'aws-sdk'
import { AttributeMap, BatchGetItemInput, BatchGetItemOutput, BatchGetResponseMap } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, toAttributeMapArray, fromAttributeMapArray, DB_NAME } from './DynamoDbClient';
import { DynamoItemKey, ExistingDynamoItem, DynamoItem } from './BaseItemManager';

export const batchGetItem = (items: {id:string, meta:string}[]): Promise<DynamoItem[]> => 
    new Promise((resolve, reject) => 
{
    const keys: AttributeMap[] = toAttributeMapArray(items.map(i => {return {id:i.id, meta:i.meta}}))

    const params: BatchGetItemInput = {
        RequestItems: {
            [DB_NAME]: {
                Keys: keys
            }
        },
        ReturnConsumedCapacity: 'TOTAL', 
    }

    // write item to the database
    dynamoDbClient.batchGetItem(params, (error: AWSError, result: BatchGetItemOutput) => {
        if (error) {
            return reject(error)
        }
        process.env.DEBUG || console.log("====DDB==== BatchGetItemOutput: ", result)
        
        // create a response
        return resolve(fromAttributeMapArray((result.Responses as BatchGetResponseMap)[DB_NAME] as AttributeMap[]) as DynamoItem[])
    })
})