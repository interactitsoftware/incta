'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { DynamoDB } from 'aws-sdk'
import { AttributeValue, TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList, AttributeMap } from 'aws-sdk/clients/dynamodb'
import { DynamoItem } from './BaseItemManager';
import { dynamoDbClient, DB_NAME, toAttributeMap, ensureOnlyNewKeyUpdates, versionString, refkeyitemmeta, ddbRequest } from './DynamoDbClient';
import { ppjson } from 'aarts-utils/utils';
import { RefKey } from './interfaces';


export const transactUpdateItem = async <T extends DynamoItem>(existingItem: T, itemUpdates: Partial<T>, __item_refkeys: RefKey<T>[]): Promise<T> => {
    const drevisionsUpdates = toAttributeMap(
        { "inc_revision": 1, "start_revision": 0 })
    const ditemUpdates: DynamoDB.AttributeMap = toAttributeMap(
        ensureOnlyNewKeyUpdates(existingItem, itemUpdates)
    )
    const dexistingItemkey = { id: { S: itemUpdates.id }, meta: { S: itemUpdates.meta } };
    const dexistingItem = toAttributeMap(existingItem)

    if (Object.keys(ditemUpdates).length === 1 && "revisions" in ditemUpdates) {
        // no new updates, only revision passed
        throw new Error(`no new updates, only revision passed for id[${existingItem.id}]`)
    }
    const updateExpr = `set #revisions = if_not_exists(#revisions, :start_revision) + :inc_revision, ${Object.keys(ditemUpdates).filter(uk => uk != "revisions").map(uk => `#${uk} = :${uk}`).join(", ")}`
    const updateExprHistory = `set ${Object.keys(ditemUpdates).filter(diu => diu in dexistingItem).map(uk => `#${uk} = :${uk}`).join(", ")}`

    //#region DEBUG msg
    !process.env.DEBUGGER || console.log("================================================")
    !process.env.DEBUGGER || console.log('existing item ', existingItem)
    !process.env.DEBUGGER || console.log('itemUpdates ', itemUpdates)
    !process.env.DEBUGGER || console.log("drevisionsUpdates ", drevisionsUpdates)
    !process.env.DEBUGGER || console.log("ditemUpdates ", ditemUpdates)
    !process.env.DEBUGGER || console.log("dexistingItemkey ", dexistingItemkey)
    !process.env.DEBUGGER || console.log("updateExpr ", updateExpr)
    !process.env.DEBUGGER || console.log("updateExprHistory ", updateExprHistory)
    !process.env.DEBUGGER || console.log("================================================")
    //#endregion


    const updateExpressionValues: Record<AttributeName, AttributeValue> = Object.assign(
        {},
        Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
            accum[`:${key}`] = ditemUpdates[key].S !== "__del__" ? ditemUpdates[key] : { NULL: true }
            return accum
        }, {}),
        Object.keys(drevisionsUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
            accum[`:${key}`] = drevisionsUpdates[key]
            return accum
        }, {})
    )
    const updateExpressionNames: Record<AttributeName, AttributeName> = Object.keys(ditemUpdates)
        .reduce<{ [key: string]: AttributeName }>((accum, key) => {
            accum[`#${key}`] = key
            return accum
        }, {})
    const itemTransactWriteItemList: TransactWriteItemList = [
        {
            Update: {
                ConditionExpression: `#revisions = :revisions`,
                Key: dexistingItemkey,
                TableName: DB_NAME,
                ExpressionAttributeNames: updateExpressionNames,
                ExpressionAttributeValues: updateExpressionValues,
                UpdateExpression: updateExpr,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
            }
        },
        // { // PUT the history record
        //     Put: {
        //         TableName: DB_NAME,
        //         ReturnValuesOnConditionCheckFailure: "ALL_OLD",
        //         Item: Object.assign({
        //             id: dexistingItemkey.id,
        //             meta: { S: `${versionString(++existingItem.revisions)}|${existingItem.item_type}` },
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
                    meta: { S: `${versionString(++existingItem.revisions)}|${existingItem.item_type}` },
                }),
                UpdateExpression: updateExprHistory,
                ExpressionAttributeNames: Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeName }>((accum, key) => {
                    if (key in dexistingItem) { // value may not existed in item being updated
                        accum[`#${key}`] = key
                    }
                    return accum
                }, {}),
                ExpressionAttributeValues: Object.assign(
                    {},
                    Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
                        if (key in dexistingItem) { // value may not existed in item being updated
                            accum[`:${key}`] = dexistingItem[key]
                        }
                        return accum
                    }, {})
                ),
            }
        }
    ]
    // build all updates by also examining refkeys
    const allTransactWriteItemList =
        itemTransactWriteItemList.concat(
            Object.keys(dexistingItem).reduce<TransactWriteItem[]>((accum, key) => {
                const isRefKey = __item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1
                const isUniqueRefKey = isRefKey && __item_refkeys.filter(r => r.key === key)[0].unique === true
                if (isRefKey && (!ditemUpdates[key] || ditemUpdates[key].S !== "__del__")) { // changed/added ones
                    !process.env.DEBUGGER || console.log(`refkey ${key} marked for create`)
                    const dmetadataupdateExpressionNames: Record<AttributeName, AttributeName> = "S" in dexistingItem[key] ? { "#smetadata": "smetadata" } : { "#nmetadata": "nmetadata" }
                    const dmetadataupdateExpressionValues: Record<AttributeName, AttributeValue> = "S" in dexistingItem[key] ? { ":smetadata": ditemUpdates[key] || dexistingItem[key] } : { ":nmetadata": ditemUpdates[key] || dexistingItem[key] }

                    accum.push({
                        Update: {
                            ConditionExpression: `#revisions = :revisions`,
                            Key: { id: dexistingItemkey.id, meta: { S: refkeyitemmeta(existingItem, key) } },
                            TableName: DB_NAME,
                            ExpressionAttributeNames: Object.assign(
                                {},
                                dmetadataupdateExpressionNames,
                                updateExpressionNames
                            ),
                            ExpressionAttributeValues: Object.assign(
                                {},
                                dmetadataupdateExpressionValues,
                                updateExpressionValues
                            ),
                            UpdateExpression: updateExpr + ("S" in dexistingItem[key] ? ", #smetadata = :smetadata" : ", #nmetadata = :nmetadata"),
                            ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                        }
                    })
                }
                if (isUniqueRefKey) {
                    if (dexistingItem[key]) { // if uq constraint already present, delete it
                        accum.push({
                            Delete: {
                                Key: toAttributeMap({ id: `uq|${existingItem.item_type}}${key}`, meta: `${existingItem[key]}` }),
                                TableName: DB_NAME,
                                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                            }
                        })
                    }
                    if (ditemUpdates[key].S !== "__del__") {
                        accum.push({
                            Put: {
                                Item: toAttributeMap({ id: `uq|${existingItem.item_type}}${key}`, meta: `${itemUpdates[key]}` }),
                                TableName: DB_NAME,
                                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                                ConditionExpression: "attribute_not_exists(#id) and attribute_not_exists(#meta)",
                                ExpressionAttributeNames: { "#id": "id", "#meta": "meta" }
                            }
                        })
                    }
                }
                return accum
            }, [])).concat(
                Object.keys(dexistingItem).reduce<TransactWriteItem[]>((accum, key) => {
                    if (__item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1 && ditemUpdates[key] && ditemUpdates[key].S === "__del__") { // removed ones
                        !process.env.DEBUGGER || console.log(`refkey ${key} marked for delete`)
                        accum.push({
                            Delete: {
                                Key: { id: dexistingItemkey.id, meta: { S: `${existingItem.item_type}}${key}` } },
                                TableName: DB_NAME,
                                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                            }
                        })
                    }
                    return accum
                }, []))

    const params: TransactWriteItemsInput = {
        TransactItems: allTransactWriteItemList,
        ReturnConsumedCapacity: "TOTAL",
        ReturnItemCollectionMetrics: "SIZE",
        // ClientRequestToken: ringToken // TODO
    }

    delete itemUpdates.revisions
    const result = await ddbRequest(dynamoDbClient.transactWriteItems(params))
    !process.env.DEBUGGER || console.log("====DDB==== TransactWriteItemsOutput: ", ppjson(result))

    return Object.assign(existingItem,
        Object.keys(itemUpdates).filter(k => itemUpdates[k] === "__del__")
            .reduce<Record<string, any>>((accum, prop) => {
                accum[prop] = undefined
                return accum
            }, {}))
}