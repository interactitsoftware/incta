'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { DynamoDB } from 'aws-sdk'
import { AttributeValue, TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, DB_NAME, toAttributeMap, ensureOnlyNewKeyUpdates, versionString, deletedVersionString, ddbRequest } from './DynamoDbClient';
import { loginfo, ppjson } from 'aarts-utils';
import { RefKey } from './interfaces';
import { DynamoItem } from './DynamoItem';


export const transactDeleteItem = async <T extends DynamoItem>(existingItem: T, __item_refkeys: RefKey<T>[], ringToken: string): Promise<T> => {
    let itemUpdates = { id: existingItem.id, meta: existingItem.meta } //i.e all items are to be updated, when deleting

    const drevisionsUpdates = toAttributeMap(
        { "inc_revision": 1, "start_revision": 0 })
    const ditemUpdates: DynamoDB.AttributeMap = toAttributeMap(
        ensureOnlyNewKeyUpdates(existingItem, itemUpdates)
    )
    const dexistingItemkey = { id: { S: itemUpdates.id }, meta: { S: itemUpdates.meta } };
    const dexistingItem = toAttributeMap(existingItem)


    //#region DEBUG msg
    !process.env.DEBUGGER || loginfo({ringToken}, 'existing item ', ppjson(existingItem))
    !process.env.DEBUGGER || loginfo({ringToken}, 'itemUpdates ', ppjson(itemUpdates))
    !process.env.DEBUGGER || loginfo({ringToken}, "drevisionsUpdates ", ppjson(drevisionsUpdates))
    !process.env.DEBUGGER || loginfo({ringToken}, "ditemUpdates ", ppjson(ditemUpdates))
    !process.env.DEBUGGER || loginfo({ringToken}, "dexistingItemkey ", ppjson(dexistingItemkey))
    //#endregion

    const updateExpr = `set #revisions = if_not_exists(#revisions, :start_revision) + :inc_revision, ${Object.keys(ditemUpdates).filter(uk => uk != "revisions").map(uk => `#${uk} = :${uk}`).join(", ")}`
    const updateExprHistory = `set ${Object.keys(dexistingItem).filter(diu => diu !== "id" && diu !== "meta").map(uk => `#${uk} = :${uk}`).join(", ")}`
    console.log(updateExpr)

    const itemTransactWriteItemList: TransactWriteItemList = [
        {
            Delete: {
                Key: dexistingItemkey,
                TableName: DB_NAME,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
            }
        },
        // { // PUT the history record
        //     Put: {
        //         TableName: DB_NAME,
        //         ReturnValuesOnConditionCheckFailure: "ALL_OLD",
        //         Item: Object.assign({
        //             id: dexistingItemkey.id,
        //             meta: { S: `${versionString(++existingItem.revisions)}|${existingItem.__typename}` },
        //         }
        //             , Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
        //                 accum[key] = dexistingItem[key]
        //                 return accum
        //             }, {})
        //         )
        //     }
        { // UPDATE the history record
            Update: {
                TableName: DB_NAME,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                Key: Object.assign({
                    id: dexistingItemkey.id,
                    meta: { S: `${deletedVersionString(++existingItem.revisions)}|${existingItem.__typename}` },
                }),
                UpdateExpression: updateExprHistory,
                ExpressionAttributeNames: Object.keys(dexistingItem).reduce<{ [key: string]: AttributeName }>((accum, key) => {
                    if (key !== "id" && key !== "meta") { // all existing keys except the table HASH key
                        accum[`#${key}`] = key
                    }
                    return accum
                }, {}),
                ExpressionAttributeValues: Object.assign(
                    {},
                    Object.keys(dexistingItem).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
                        if (key !== "id" && key !== "meta") { // all existing keys except the table HASH key
                            accum[`:${key}`] = dexistingItem[key]
                        }
                        return accum
                    }, {})
                ),
            }
        }
    ]
    // build all updates by also examining refkeys
    const allTransactWriteItemList = Object.keys(dexistingItem).reduce<TransactWriteItem[]>((accum, key) => {
        if (__item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1) {
            accum.push({
                Delete: {
                    Key: { id: dexistingItemkey.id, meta: { S: `${existingItem.__typename}}${key}` } },
                    TableName: DB_NAME,
                    ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                }
            })
        }
        if (__item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1 && __item_refkeys.filter(r => r.key === key)[0].unique === true) {
            accum.push({
                Delete: {
                    Key: toAttributeMap({ id: `uq|${existingItem.__typename}}${key}`, meta: `${existingItem[key]}` }),
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

    try {
        const result = await ddbRequest(dynamoDbClient.transactWriteItems(params), ringToken)
        !process.env.DEBUGGER || loginfo({ringToken}, "====DDB==== TransactWriteItemsOutput: ", ppjson(result))
    } catch (err) {
        throw new Error(ppjson({ request: params, error: err }))
    }
    return existingItem
}