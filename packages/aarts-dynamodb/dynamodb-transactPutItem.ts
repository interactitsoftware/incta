'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { TransactWriteItemsInput, TransactWriteItem, TransactWriteItemList } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, DB_NAME, toAttributeMap, refkeyitem, uniqueitemrefkeyid, ddbRequest, versionString, toAttributeMapKeysOnly } from './DynamoDbClient';
import { loginfo, ppjson } from 'aarts-utils';
import { RefKey } from './interfaces';
import { DynamoItem } from './DynamoItem';

export const transactPutItem = async <T extends DynamoItem>(item: T, __item_refkeys?: RefKey<T>[]): Promise<T> => {
    !process.env.DEBUGGER || loginfo(`In transactPutItem. refkeys:`, __item_refkeys)


    // New approach where reffered item is being loaded in same key as the corresponding refkey but with Upper case first letter
    // --> check for any refs loaded and unload them before creating starts
    if (__item_refkeys) {
        const itemRefs = __item_refkeys.filter(k => !!k.ref).map(k => k.ref)
        for (const prop in Object.keys(item)) {
            if (itemRefs.indexOf(prop) > -1 && prop === `${prop[0].toUpperCase()}${prop.slice(1)}`) {
                delete item[prop]
            }
        }
    }
    // <-- 

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
                    Item: !!process.env.copyEntireItemToGsis ? toAttributeMap(refkeyitem(item, key)) : toAttributeMapKeysOnly(refkeyitem(item, key), ["id", "meta", "smetadata", "nmetadata"]),
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

    const params: TransactWriteItemsInput = {
        TransactItems: allTransactWriteItemList,
        ReturnConsumedCapacity: "TOTAL",
        ReturnItemCollectionMetrics: "SIZE",
        // ClientRequestToken: ringToken // TODO
    }

    // write item to the database
    try {
        const result = await ddbRequest(dynamoDbClient.transactWriteItems(params))
        !process.env.DEBUGGER || loginfo("====DDB==== TransactWriteItemsOutput: ", result)
    } catch (err) {
        throw new Error(/*ppjson({request: params, error: err})*/err)
    }
        
    return item
}