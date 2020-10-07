'use strict'

import { DynamoDB } from 'aws-sdk'
import { AttributeValue, TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList, AttributeMap, UpdateItemInput } from 'aws-sdk/clients/dynamodb'
import { DynamoItem } from './BaseItemManager';
import { dynamoDbClient, DB_NAME, toAttributeMap, ensureOnlyNewKeyUpdates, versionString, refkeyitemmeta, ddbRequest } from './DynamoDbClient';
import { loginfo, ppjson } from 'aarts-utils/utils';
import { RefKey } from './interfaces';


export const transactUpdateItem = async <T extends DynamoItem>(existingItem: T, itemUpdates: Partial<T>, __item_refkeys: RefKey<T>[]): Promise<T> => {
    // --> check for any refs loaded and unload them before updating starts
    Object.assign(itemUpdates, Object.keys(itemUpdates).reduce<Record<string, string>>((accum, key) => {
        if (__item_refkeys.filter(k => !k.unique && !!k.ref).map(k => k.key).indexOf(key) > -1 && typeof itemUpdates[key] !== undefined && typeof itemUpdates[key] !== 'string') {
            accum[key] = (itemUpdates as T)[key].id
        }
        return accum
    }, {}))
    console.log("======================== ", itemUpdates)
    // <-- 

    const drevisionsUpdates = toAttributeMap(
        { "inc_revision": 1, "start_revision": 0 })
    const ditemUpdates: DynamoDB.AttributeMap = toAttributeMap(
        ensureOnlyNewKeyUpdates(existingItem, itemUpdates)
    )
    const dexistingItemkey = { id: { S: itemUpdates.id }, meta: { S: itemUpdates.meta } };
    const dexistingItem = toAttributeMap(existingItem)

    if (Object.keys(ditemUpdates).length === 0 || (Object.keys(ditemUpdates).length === 1 && "revisions" in ditemUpdates)) {
        // no new updates, only revision passed
        throw new Error(`${process.env.ringToken}: no new update for id[${existingItem.id}]`)
    }

    if (!!ditemUpdates["__typename"]) {
        // forbid changing item's type
        throw new Error(`${process.env.ringToken}: changing __typename is forbidden`)
    }

    const updateExpr = `set #revisions = if_not_exists(#revisions, :start_revision) + :inc_revision, ${Array.from(new Set(Object.keys(dexistingItem).concat(Object.keys(ditemUpdates)))).filter(uk => ["revisions", "id", "meta"].indexOf(uk) === -1).map(uk => `#${uk} = :${uk}`).join(", ")}`
    // in the case of proc_ updates revisions is not being passed so ensure its always in the list:
    const updateExprHistory = `set ${Object.keys(ditemUpdates).filter(diu => diu !== "revisions" && diu in dexistingItem).concat(["revisions"]).map(uk => `#${uk} = :${uk}`).join(", ")}`

    const updateExpressionValues: Record<AttributeName, AttributeValue> = Object.assign(
        {},
        Array.from(new Set(Object.keys(dexistingItem).concat(Object.keys(ditemUpdates)))).filter(key => ["id", "meta"].indexOf(key) === -1).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
            accum[`:${key}`] = !!ditemUpdates[key] ? ditemUpdates[key].S !== "__del__" ? ditemUpdates[key] : { NULL: true } : dexistingItem[key]
            return accum
        }, {}),
        Object.keys(drevisionsUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
            accum[`:${key}`] = drevisionsUpdates[key]
            return accum
        }, {})
    )
    const updateExpressionNames: Record<AttributeName, AttributeName> =
        Array.from(new Set(Object.keys(dexistingItem).concat(Object.keys(ditemUpdates)))).filter(key => ["id", "meta"].indexOf(key) === -1)
            .reduce<{ [key: string]: AttributeName }>((accum, key) => {
                accum[`#${key}`] = key
                return accum
            }, {})

    //#region DEBUG msg
    !process.env.DEBUGGER || loginfo("================================================")
    !process.env.DEBUGGER || loginfo('existing item ', existingItem)
    !process.env.DEBUGGER || loginfo('itemUpdates ', itemUpdates)
    !process.env.DEBUGGER || loginfo("drevisionsUpdates ", drevisionsUpdates)
    !process.env.DEBUGGER || loginfo("ditemUpdates ", ditemUpdates)
    !process.env.DEBUGGER || loginfo("dexistingItemkey ", dexistingItemkey)
    !process.env.DEBUGGER || loginfo("updateExpr ", updateExpr)
    !process.env.DEBUGGER || loginfo('existing item ', existingItem)
    !process.env.DEBUGGER || loginfo("updateExpressionNames ", updateExpressionNames)
    !process.env.DEBUGGER || loginfo("updateExpressionValues ", updateExpressionValues)
    !process.env.DEBUGGER || loginfo("updateExprHistory ", updateExprHistory)
    !process.env.DEBUGGER || loginfo("================================================")
    //#endregion
    const itemTransactWriteItemList: TransactWriteItemList = [
        {
            Update: {
                ConditionExpression: existingItem.__typename.startsWith("proc_") ? `(attribute_not_exists(#revisions) OR attribute_exists(#revisions) OR #revisions = :revisions)` : `(attribute_not_exists(#revisions) OR #revisions = :revisions)`,
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
                    meta: { S: `${versionString(++existingItem.revisions)}|${existingItem.__typename}` },
                }),
                UpdateExpression: updateExprHistory,
                ExpressionAttributeNames: Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeName }>((accum, key) => {
                    if (key != "revisions" && key in dexistingItem) { // value may not existed in item being updated
                        accum[`#${key}`] = key
                    }
                    return accum
                }, {"#revisions": "revisions"}),
                ExpressionAttributeValues: Object.assign(
                    {},
                    Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
                        if (key != "revisions" && key in dexistingItem) { // value may not existed in item being updated
                            accum[`:${key}`] = dexistingItem[key]
                        }
                        return accum
                    }, {":revisions": dexistingItem["revisions"]})
                ),
            }
        }
    ]
    // build all updates by also examining refkeys
    const allTransactWriteItemList =
        itemTransactWriteItemList.concat(
            Array.from(new Set(Object.keys(dexistingItem).concat(Object.keys(ditemUpdates)))).filter(key => ["id", "meta"].indexOf(key) === -1).reduce<TransactWriteItem[]>((accum, key) => {
                !process.env.DEBUGGER || loginfo(`[Update, examining refkeys of ${existingItem.__typename}] analysing key: ${key}`);
                const isRefKey = __item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1
                const isUniqueRefKey = isRefKey && __item_refkeys.filter(r => r.key === key)[0].unique === true
                if (isRefKey && ((!dexistingItem[key] || dexistingItem[key].S !== "__del__") && (!ditemUpdates[key] || ditemUpdates[key].S !== "__del__"))) { // changed/added ones, without those marked for delete  // TODO changed from  isRefKey &&  (!ditemUpdates[key] || ditemUpdates[key].S !== "__del__")
                    !process.env.DEBUGGER || loginfo(`refkey ${key} marked for create`)

                    const dmetadataupdateExpressionNames: Record<AttributeName, AttributeName> = !!dexistingItem[key] ?
                        "S" in dexistingItem[key] ? { "#smetadata": "smetadata" } : { "#nmetadata": "nmetadata" } :
                        "S" in ditemUpdates[key] ? { "#smetadata": "smetadata" } : { "#nmetadata": "nmetadata" }
                    const dmetadataupdateExpressionValues: Record<AttributeName, AttributeValue> = !!dexistingItem[key] ?
                        "S" in dexistingItem[key] ? { ":smetadata": ditemUpdates[key] || dexistingItem[key] } : { ":nmetadata": ditemUpdates[key] || dexistingItem[key] } :
                        "S" in ditemUpdates[key] ? { ":smetadata": ditemUpdates[key] || dexistingItem[key] } : { ":nmetadata": ditemUpdates[key] || dexistingItem[key] }

                    accum.push({
                        Update: {
                            ConditionExpression: existingItem.__typename.startsWith("proc_") ? `(attribute_not_exists(#revisions) OR attribute_exists(#revisions) OR #revisions = :revisions)` : `(attribute_not_exists(#revisions) OR #revisions = :revisions)`,
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
                            UpdateExpression: updateExpr + (!!dexistingItem[key] ? "S" in dexistingItem[key] ? ", #smetadata = :smetadata" : ", #nmetadata = :nmetadata" : "S" in ditemUpdates[key] ? ", #smetadata = :smetadata" : ", #nmetadata = :nmetadata"),
                            ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                        }
                    })
                }
                if (isUniqueRefKey) {
                    if (dexistingItem[key]) { // if uq constraint already present, delete it
                        accum.push({
                            Delete: {
                                Key: toAttributeMap({ id: `uq|${existingItem.__typename}}${key}`, meta: `${existingItem[key]}` }),
                                TableName: DB_NAME,
                                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                            }
                        })
                    }
                    if (ditemUpdates[key] && ditemUpdates[key].S !== "__del__") {
                        accum.push({
                            Put: {
                                Item: toAttributeMap({ id: `uq|${existingItem.__typename}}${key}`, meta: `${itemUpdates[key]}` }),
                                TableName: DB_NAME,
                                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                                ConditionExpression: "(attribute_not_exists(#id) and attribute_not_exists(#meta))",
                                ExpressionAttributeNames: { "#id": "id", "#meta": "meta" }
                            }
                        })
                    }
                }
                return accum
            }, [])).concat(
                Object.keys(dexistingItem).reduce<TransactWriteItem[]>((accum, key) => {
                    if (__item_refkeys && __item_refkeys.map(r => r.key).indexOf(key) > -1 && ditemUpdates[key] && ditemUpdates[key].S === "__del__") { // removed ones
                        !process.env.DEBUGGER || loginfo(`refkey ${key} marked for delete`)
                        accum.push({
                            Delete: {
                                Key: { id: dexistingItemkey.id, meta: { S: `${existingItem.__typename}}${key}` } },
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
    try {
        const result = await ddbRequest(dynamoDbClient.transactWriteItems(params))
        !process.env.DEBUGGER || loginfo("====DDB==== TransactWriteItemsOutput: ", ppjson(result))
    } catch (err) {
        throw new Error(ppjson({request: params, error: err}))
    }

    // upon a successful transaction (ie this code is reached, tx passed), update the total processed events of a procedure (if it was provided)
    // if (!!itemUpdates["procedure"] && process.env.ringToken === itemUpdates["procedure"].substr(itemUpdates["procedure"].indexOf("|") + 1)) {
    //     const resultUpdateProcEvents = await ddbRequest(dynamoDbClient.updateItem({
    //         TableName: DB_NAME,
    //         Key: Object.assign({
    //             id: { S: itemUpdates["procedure"] },
    //             meta: { S: `${versionString(0)}|${itemUpdates["procedure"].substr(0, itemUpdates["procedure"].indexOf("|"))}` },
    //         }),
    //         UpdateExpression: `SET #processed_events = if_not_exists(#processed_events, :zero) + :inc_one`,
    //         ExpressionAttributeNames: { [`#processed_events`]: "processed_events" },
    //         ExpressionAttributeValues: { ":zero": { "N": "0" }, ":inc_one": { "N": "1" } },
    //     }))
    //     !process.env.DEBUGGER || loginfo("====DDB==== UpdateItemOutput: ", ppjson(resultUpdateProcEvents))
    // }

    return Object.assign(existingItem,
        Object.keys(itemUpdates).filter(k => itemUpdates[k] === "__del__")
            .reduce<Record<string, any>>((accum, prop) => {
                accum[prop] = undefined
                return accum
            }, {}))
}