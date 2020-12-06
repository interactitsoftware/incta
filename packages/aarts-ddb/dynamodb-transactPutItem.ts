'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { TransactWriteItemsInput, TransactWriteItem, TransactWriteItemList, AttributeMap } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, DB_NAME, toAttributeMap, refkeyitem, uniqueitemrefkeyid, ddbRequest, versionString, toAttributeMapKeysOnly } from './DynamoDbClient';
import { loginfo, ppjson } from 'aarts-utils';
import { RefKey } from './interfaces';
import { DynamoItem } from './DynamoItem';

export const transactPutItem = async <T extends DynamoItem>(item: T, __item_refkeys?: Map<string, RefKey<T>>): Promise<T> => {
    const ditem = toAttributeMap(item)
    !process.env.DEBUGGER || loginfo({ringToken: item.ringToken as string}, `In transactPutItem. refkeys:`, ppjson(__item_refkeys))
    !process.env.DEBUGGER || loginfo({ringToken: item.ringToken as string}, `item to create:`, ppjson(item))
    !process.env.DEBUGGER || loginfo({ringToken: item.ringToken as string}, `ditem:`, ppjson(ditem))

    // New approach where reffered item is being loaded in same key as the corresponding refkey but with Upper case first letter
    // --> check for any refs loaded and unload them before creating starts
    if (__item_refkeys) {
        const itemRefs = Array.from(__item_refkeys.values()).filter(k => !!k.ref).map(k => k.ref)
        for (const prop in Object.keys(item)) {
            if (itemRefs.indexOf(prop) > -1 && prop === `${prop[0].toUpperCase()}${prop.slice(1)}`) {
                delete item[prop]
            }
        }
    }
    // <-- 

    // copy gsi keys
    Object.keys(ditem).reduce<AttributeMap>((accum, key) => {
        if (__item_refkeys && __item_refkeys.has(key) && !!item[key]) {
            if (!! __item_refkeys.get(key)?.gsiKey && Array.isArray( __item_refkeys.get(key)?.gsiKey)) {
                for (const gsiKey of __item_refkeys.get(key)?.gsiKey as string []) {
                    accum[gsiKey] =  ditem[key]
                }
            }
        }
        return accum
    }, ditem)
    ditem["smetadata"] = {S:`${item.__typename}|${item.item_state}`}
    ditem["nshard"] = {N: `${~~(Math.random()*10)}`}

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

    const allTransactWriteItemList = Object.keys(ditem).reduce<TransactWriteItem[]>((accum, key) => {
        if (__item_refkeys && __item_refkeys.has(key) && !!item[key] && __item_refkeys.get(key)?.unique === true) {
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
        const result = await ddbRequest(dynamoDbClient.transactWriteItems(params), item.ringToken as string)
        !process.env.DEBUGGER || loginfo({ringToken: item.ringToken as string}, "====DDB==== TransactWriteItemsOutput: ", ppjson(result))
    } catch (err) {
        throw new Error(/*ppjson({request: params, error: err})*/err)
    }
        
    return item
}