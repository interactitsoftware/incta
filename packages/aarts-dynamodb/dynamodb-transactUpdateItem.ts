'use strict'

import { DynamoDB } from 'aws-sdk'
import { AttributeValue, TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList, AttributeMap, UpdateItemInput } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, DB_NAME, toAttributeMap, ensureOnlyNewKeyUpdates, versionString, refkeyitemmeta, ddbRequest, leaveKeysOnly } from './DynamoDbClient';
import { loginfo, ppjson } from 'aarts-utils';
import { RefKey } from './interfaces';
import { DynamoItem } from './DynamoItem';


export const transactUpdateItem = async <T extends DynamoItem>(existingItem: T, itemUpdates: Partial<T>, __item_refkeys: RefKey<T>[]): Promise<T> => {

    //#region DEBUG msg
    !process.env.DEBUGGER || loginfo('START TransactUpdateItem')
    !process.env.DEBUGGER || loginfo('existing item ', existingItem)
    !process.env.DEBUGGER || loginfo('itemUpdates ', itemUpdates)
    //#endregion

    // --> check for any refs loaded and unload them before updating starts
    const itemRefs = __item_refkeys.filter(k => !!k.ref).map(k => k.ref)
    for (const prop in Object.keys(itemUpdates)) {
        if (itemRefs.indexOf(prop) > -1 && prop === `${prop[0].toUpperCase()}${prop.slice(1)}`) {
            delete itemUpdates[prop]
        }
    }
    // <-- 

    const drevisionsUpdates = toAttributeMap({ "inc_revision": 1, "start_revision": 0 })
    const ditemUpdates: DynamoDB.AttributeMap = toAttributeMap(ensureOnlyNewKeyUpdates(existingItem, itemUpdates))
    const dexistingItemkey = { id: { S: itemUpdates.id }, meta: { S: itemUpdates.meta } };
    const dexistingItem = toAttributeMap(existingItem)
    const drefkeyUpdates = toAttributeMap(leaveKeysOnly(itemUpdates, __item_refkeys.map(r => r.key as string)))
    const dKeysToDelete = Object.keys(ditemUpdates).reduce<AttributeMap>((accum, key) => {
        if (!!ditemUpdates[key].S && ditemUpdates[key].S === "__del__") {
            accum[key] = ditemUpdates[key]
        }
        return accum
    }, {})
    const dKeysTuUpdate = Object.keys(ditemUpdates).filter(uk => ["revisions", "id", "meta"].indexOf(uk) === -1 && ditemUpdates[uk].S !== "__del__")

    if (Object.keys(ditemUpdates).length === 0 || (Object.keys(ditemUpdates).length === 1 && "revisions" in ditemUpdates)) {
        // no new updates, only revision passed
        throw new Error(`${process.env.ringToken}: no new update for id[${existingItem.id}]`)
    }
    if (!!ditemUpdates["__typename"]) {
        // forbid changing item's type
        throw new Error(`${process.env.ringToken}: changing __typename is forbidden`)
    }
    if (!ditemUpdates["revisions"]) {
        // forbid changing item if revisions is not passed
        throw new Error(`${process.env.ringToken}: changing item without passing revisions is forbidden`)
    }

    const updateExpr = "set #revisions = if_not_exists(#revisions, :start_revision) + :inc_revision"
        + (dKeysTuUpdate.length > 0 ? `, ${dKeysTuUpdate.map(uk => `#${uk} = :${uk}`).join(", ")}` : '')
        + (Object.keys(dKeysToDelete).length > 0 ? ` remove ${Object.keys(dKeysToDelete).map(uk => `#${uk}`).join(", ")}` : '')

    const updateExprHistory = `set ${Object.keys(ditemUpdates).map(uk => `#${uk} = :${uk}`).join(", ")}`

    const updateExpressionValues: Record<AttributeName, AttributeValue> = Object.assign(
        {},
        Object.keys(ditemUpdates).filter(key => ["id", "meta"].indexOf(key) === -1 && Object.keys(dKeysToDelete).indexOf(key) === -1).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
            accum[`:${key}`] = ditemUpdates[key]
            return accum
        }, {}),
        Object.keys(drevisionsUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
            accum[`:${key}`] = drevisionsUpdates[key]
            return accum
        }, {})
    )
    const updateExpressionNames: Record<AttributeName, AttributeName> =
        Object.keys(ditemUpdates).filter(key => ["id", "meta"].indexOf(key) === -1)
            .reduce<{ [key: string]: AttributeName }>((accum, key) => {
                accum[`#${key}`] = key
                return accum
            }, {})

    //#region DEBUG msg
    !process.env.DEBUGGER || loginfo("drevisionsUpdates ", drevisionsUpdates)
    !process.env.DEBUGGER || loginfo("ditemUpdates ", ditemUpdates)
    !process.env.DEBUGGER || loginfo("dKeysToDelete ", dKeysToDelete)
    !process.env.DEBUGGER || loginfo("dKeysTuUpdate ", dKeysTuUpdate)
    !process.env.DEBUGGER || loginfo("drefkeyUpdates ", drefkeyUpdates)
    !process.env.DEBUGGER || loginfo("dexistingItemkey ", dexistingItemkey)
    !process.env.DEBUGGER || loginfo("updateExpr ", updateExpr)
    !process.env.DEBUGGER || loginfo("updateExpressionNames ", updateExpressionNames)
    !process.env.DEBUGGER || loginfo("updateExpressionValues ", updateExpressionValues)
    !process.env.DEBUGGER || loginfo("updateExprHistory ", updateExprHistory)
    //#endregion
    const itemTransactWriteItemList: TransactWriteItemList = [
        {
            Update: {
                ConditionExpression: `(attribute_not_exists(#revisions) OR #revisions = :revisions)`,
                Key: dexistingItemkey,
                TableName: DB_NAME,
                ExpressionAttributeNames: updateExpressionNames,
                ExpressionAttributeValues: updateExpressionValues,
                UpdateExpression: updateExpr,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
            }
        },
        { // update (create) the history record
            Update: {
                TableName: DB_NAME,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                Key: Object.assign({
                    id: dexistingItemkey.id,
                    meta: { S: `${versionString(existingItem.revisions + 1)}|${existingItem.__typename}` },
                }),
                UpdateExpression: updateExprHistory,
                ExpressionAttributeNames: Object.assign(
                    Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeName }>((accum, key) => {
                        accum[`#${key}`] = key
                        return accum
                    }, {})
                ),
                ExpressionAttributeValues:
                    Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
                        accum[`:${key}`] = dexistingItem[key] || { NULL: true }  // value may not existed in item being updated
                        return accum
                    }, {})
            }
        }
    ]
    // build all updates by also examining refkeys
    const allTransactWriteItemList =
        itemTransactWriteItemList.concat(
            Object.keys(drefkeyUpdates).filter(r => drefkeyUpdates[r].S !== "__del__").reduce<TransactWriteItem[]>((accum, key) => {

                const dmetadataupdateExpressionNames: Record<AttributeName, AttributeName> =
                    !!drefkeyUpdates[key].S ? { "#smetadata": "smetadata" } : { "#nmetadata": "nmetadata" }
                const dmetadataupdateExpressionValues: Record<AttributeName, AttributeValue> =
                    !!drefkeyUpdates[key].S ? { ":smetadata": drefkeyUpdates[key] } : { ":nmetadata": drefkeyUpdates[key] }

                !process.env.DEBUGGER || loginfo(`Updating refkey: ${key} of ${existingItem.__typename}: `);
                !process.env.DEBUGGER || loginfo(`dmetadataupdateExpressionNames:`, dmetadataupdateExpressionNames);
                !process.env.DEBUGGER || loginfo(`dmetadataupdateExpressionValues:`, dmetadataupdateExpressionValues);

                accum.push({
                    Update: {
                        Key: { id: dexistingItemkey.id, meta: { S: refkeyitemmeta(existingItem, key) } },
                        TableName: DB_NAME,
                        ExpressionAttributeNames: Object.assign(
                            {},
                            dmetadataupdateExpressionNames,
                            !!process.env.copyEntireItemToGsis ? updateExpressionNames : {}
                        ),
                        ExpressionAttributeValues: Object.assign(
                            {},
                            dmetadataupdateExpressionValues,
                            !!process.env.copyEntireItemToGsis ? updateExpressionValues : {}
                        ),
                        UpdateExpression: (!!process.env.copyEntireItemToGsis ? updateExpr + ", " : '') + (!!drefkeyUpdates[key].S ? "set #smetadata = :smetadata" : "set #nmetadata = :nmetadata"),
                        ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                    }
                })

                if (__item_refkeys.filter(r => r.key === key)[0].unique) {
                    if (dexistingItem[key]) { // if uq constraint already present, delete it
                        accum.push({
                            Delete: {
                                Key: toAttributeMap({ id: `uq|${existingItem.__typename}}${key}`, meta: `${existingItem[key]}` }),
                                TableName: DB_NAME,
                                ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                            }
                        })
                    }
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
                return accum
            }, [])).concat(
                Object.keys(dKeysToDelete).reduce<TransactWriteItem[]>((accum, key) => {
                    !process.env.DEBUGGER || loginfo(`refkey ${key} marked for delete`)
                    accum.push({
                        Delete: {
                            Key: { id: dexistingItemkey.id, meta: { S: `${existingItem.__typename}}${key}` } },
                            TableName: DB_NAME,
                            ReturnValuesOnConditionCheckFailure: "ALL_OLD"
                        }
                    })
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
        !process.env.DEBUGGER || loginfo("====DDB==== TransactWriteItemsOutput: ", result)
    } catch (err) {
        throw new Error(ppjson({ request: params, error: err }))
    }

    return Object.assign(existingItem,
        Object.keys(itemUpdates).filter(k => itemUpdates[k] === "__del__")
            .reduce<Record<string, any>>((accum, prop) => {
                accum[prop] = undefined
                return accum
            }, { revisions: existingItem.revisions + 1 }))
}