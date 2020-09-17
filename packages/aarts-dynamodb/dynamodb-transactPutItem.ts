'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { TransactWriteItemsInput, TransactWriteItem, TransactWriteItemList } from 'aws-sdk/clients/dynamodb'
import { DynamoItem } from './BaseItemManager';
import { dynamoDbClient, DB_NAME, toAttributeMap, refkeyitem, uniqueitemrefkeyid, ddbRequest } from './DynamoDbClient';
import { ppjson } from 'aarts-utils/utils';
import { RefKey } from './interfaces';

export const transactPutItem = async <T extends DynamoItem>(item: T, __item_refkeys?: RefKey<T>[]): Promise<T> => {
    !process.env.DEBUGGER || console.log(`In transactPutItem. refkeys ${ppjson(__item_refkeys)}`)

    const ditem = toAttributeMap(item)

    const itemTransactWriteItemList: TransactWriteItemList = [
        {
            Put: {
                TableName: DB_NAME,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                Item: ditem,
                ConditionExpression: "attribute_not_exists(id) and attribute_not_exists(meta)"
            }
        }
    ]

    // build all updates by also examining refkeys
    const allTransactWriteItemList = Object.keys(ditem).reduce<TransactWriteItem[]>((accum, key) => {
        if (__item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1 && !!item[key]) {
            accum.push({
                Put: {
                    Item: toAttributeMap(refkeyitem(item, key)),
                    TableName: DB_NAME,
                    ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                }
            })
        }
        if (__item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1 && !!item[key] && __item_refkeys.filter(r => r.key === key)[0].unique === true) {
            const duniqueItem = toAttributeMap({ id: uniqueitemrefkeyid(item, key), meta: `${item[key]}` })
            accum.push({
                Put: {
                    Item: duniqueItem,
                    TableName: DB_NAME,
                    ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                    ConditionExpression: "attribute_not_exists(#id) and attribute_not_exists(#meta)",
                    ExpressionAttributeNames: { "#id": "id", "#meta": "meta" },
                }
            })
        }

        return accum
    }, itemTransactWriteItemList)

    // TODO BE EXCERPTED INTO A SEPARATE dynamodb-streams-firehose module
    // too much transaction conflicts may occur, if lots of items created/updated
    if (process.env.PERFORM_AGGREGATIONS) {
        allTransactWriteItemList.push({ // update aggregations
            Update: {
                TableName: DB_NAME,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                Key: Object.assign({
                    id: { S: "aggregations" },
                    meta: { S: `totals` },
                }),
                UpdateExpression: `SET #item_type = if_not_exists(#item_type, :zero) + :inc_one`,
                ExpressionAttributeNames: { [`#item_type`]: item.item_type },
                ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc_one": { "N": "1" } },
            }
        })
    }

    const params: TransactWriteItemsInput = {
        TransactItems: allTransactWriteItemList,
        ReturnConsumedCapacity: "TOTAL",
        ReturnItemCollectionMetrics: "SIZE",
        // ClientRequestToken: ringToken // TODO
    }

    // write item to the database
    const result = await ddbRequest(dynamoDbClient.transactWriteItems(params))
    !process.env.DEBUGGER || console.log("====DDB==== TransactWriteItemsOutput: ", ppjson(result))
    return item
}