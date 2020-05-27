'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { AWSError } from 'aws-sdk'
import { TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList } from 'aws-sdk/clients/dynamodb'
import { ItemReference } from './BaseItemManager';
import { dynamoDbClient, DB_NAME, toAttributeMap, removeEmpty } from './DynamoDbClient';

// TODO need to pay attention if one allows more than 1 elements in the array, to restrict the number of ref keys allowed. Key is not to exceed the 25 limit
export const transactPutItem = <T extends Record<string,any>>(item: T, __item_refkeys: string[]): Promise<T> =>
    new Promise((resolve, reject) => {

        const ditem = toAttributeMap(item)

        const itemTransactWriteItemList: TransactWriteItemList = [
            { 
                Put: {
                    TableName: DB_NAME,
                    ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                    Item: ditem
                }
            }
        ]
        // build all updates by also examining refkeys
        const allTransactWriteItemList = Object.keys(ditem).reduce<TransactWriteItem[]>((accum, refkey) => {
            if (__item_refkeys && __item_refkeys.indexOf(refkey) > -1 && !!item[refkey]) {
                accum.push({
                    Put: {
                        Item: toAttributeMap(removeEmpty(new class Ref extends ItemReference(item, refkey) { }) as unknown as T),
                        TableName: DB_NAME,
                        ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                    }
                })
            }
            return accum
        }, itemTransactWriteItemList)

        const params: TransactWriteItemsInput = {
            TransactItems: allTransactWriteItemList,
            ReturnConsumedCapacity: "TOTAL",
            ReturnItemCollectionMetrics: "SIZE",
            // ClientRequestToken: ringToken // TODO
        }

        // write item to the database
        dynamoDbClient.transactWriteItems(params, (error: AWSError, result: TransactWriteItemsOutput) => {
            // handle potential errors
            if (error) {
                console.error(error)
                return reject(error)
            }

            process.env.DEBUG || console.log("====DDB==== TransactWriteItemsOutput: ", result)

            // create a response
            return resolve(item)
        })
    })