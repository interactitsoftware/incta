'use strict'

import { DynamoDB } from 'aws-sdk'
import { AttributeValue, TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList, AttributeMap, UpdateItemInput } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, DB_NAME, toAttributeMap, ensureOnlyNewKeyUpdates, versionString, refkeyitemmeta, ddbRequest, leaveKeysOnly } from './DynamoDbClient';
import { loginfo, ppjson } from 'aarts-utils';
import { RefKey } from './interfaces';
import { DynamoItem } from './DynamoItem';


export const transactUpdateItem = async <T extends DynamoItem>(existingItem: T, itemUpdates: Partial<T>, __item_refkeys: Map<string, RefKey<T>>): Promise<T> => {

    //#region DEBUG msg
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, 'START TransactUpdateItem')
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, 'existing item ', ppjson(existingItem))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, 'itemUpdates ', ppjson(itemUpdates))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, 'itemUpdates ', ppjson(__item_refkeys))
    //#endregion

    // --> check for any refs loaded and unload them before updating starts
    for (const prop in Object.keys(itemUpdates)) {
        if (__item_refkeys.has(prop) && prop === `${prop[0].toUpperCase()}${prop.slice(1)}`) {
            delete itemUpdates[prop]
        }
    }
    // <-- 

    const drevisionsUpdates = toAttributeMap({ "inc_revision": 1, "start_revision": 0 })
    const ditemUpdates: DynamoDB.AttributeMap = toAttributeMap(ensureOnlyNewKeyUpdates(existingItem, itemUpdates))
    // copy gsi keys
    Object.keys(ditemUpdates).reduce<AttributeMap>((accum, key) => {
        if (__item_refkeys && __item_refkeys.has(key)) {
            if (!!__item_refkeys.get(key)?.gsiKey && Array.isArray(__item_refkeys.get(key)?.gsiKey)) {
                for (const gsiKey of __item_refkeys.get(key)?.gsiKey as string[]) {
                    accum[gsiKey] = ditemUpdates[key]
                }
            }
        }
        return accum
    }, ditemUpdates)
    ditemUpdates["smetadata"] = { S: `${existingItem.__typename}|${itemUpdates.item_state || existingItem.item_state}` }


    const dexistingItemkey = { id: { S: itemUpdates.id }, meta: { S: itemUpdates.meta } };
    const dexistingItem = toAttributeMap(existingItem)
    const drefkeyUpdates = toAttributeMap(leaveKeysOnly(itemUpdates, Array.from(__item_refkeys.keys())))
    const dKeysToDelete = Object.keys(ditemUpdates).reduce<AttributeMap>((accum, key) => {
        if (!!ditemUpdates[key].S && ditemUpdates[key].S === "__del__") {
            accum[key] = ditemUpdates[key]
        }
        return accum
    }, {})
    const dKeysTuUpdate = Object.keys(ditemUpdates).filter(uk => ["revisions", "id", "meta"].indexOf(uk) === -1 && ditemUpdates[uk].S !== "__del__")

    if (Object.keys(ditemUpdates).length === 0 || (Object.keys(ditemUpdates).length === 1 && "revisions" in ditemUpdates)) {
        // no new updates, only revision passed
        throw new Error(`${itemUpdates.ringToken as string}: no new update for id[${existingItem.id}]`)
    }
    if (!!ditemUpdates["__typename"]) {
        // forbid changing item's type
        throw new Error(`${itemUpdates.ringToken as string}: changing __typename is forbidden`)
    }
    if (!ditemUpdates["revisions"]) {
        // forbid changing item if revisions is not passed
        throw new Error(`${itemUpdates.ringToken as string}: changing item without passing revisions is forbidden`)
    }

    const updateExpr = "set #revisions = if_not_exists(#revisions, :start_revision) + :inc_revision"
        + (dKeysTuUpdate.length > 0 ? `, ${dKeysTuUpdate.map(uk => `#${uk} = :${uk}`).join(", ")}` : '')
        + (Object.keys(dKeysToDelete).length > 0 ? ` remove ${Object.keys(dKeysToDelete).map(uk => `#${uk}`).join(", ")}` : '')

    const updateExprHistory = `set ${Object.keys(ditemUpdates).filter(key => key.indexOf("PK") === -1 && key.indexOf("SK") === -1 && key !== "smetadata" && key !== "nmetadata" && key !== "nshard").map(uk => `#${uk} = :${uk}`).join(", ")}`

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
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "drevisionsUpdates ", ppjson(drevisionsUpdates))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "ditemUpdates ", ppjson(ditemUpdates))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "dKeysToDelete ", ppjson(dKeysToDelete))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "dKeysTuUpdate ", ppjson(dKeysTuUpdate))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "drefkeyUpdates ", ppjson(drefkeyUpdates))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "dexistingItemkey ", ppjson(dexistingItemkey))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "updateExpr ", ppjson(updateExpr))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "updateExpressionNames ", ppjson(updateExpressionNames))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "updateExpressionValues ", ppjson(updateExpressionValues))
    !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "updateExprHistory ", ppjson(updateExprHistory))
    //#endregion{ringToken: itemUpdates.ringToken as string}, 
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
        { // update (which actually will create) the history record
            Update: {
                TableName: DB_NAME,
                ReturnValuesOnConditionCheckFailure: "ALL_OLD",
                Key: Object.assign({
                    id: dexistingItemkey.id,
                    meta: { S: `${versionString(existingItem.revisions + 1)}|${existingItem.__typename}` },
                }),
                UpdateExpression: updateExprHistory,
                ExpressionAttributeNames: Object.assign(
                    Object.keys(ditemUpdates)
                        .reduce<{ [key: string]: AttributeName }>((accum, key) => {
                            if (key.indexOf("PK") === -1 && key.indexOf("SK") === -1 && key !== "smetadata" && key !== "nmetadata" && key !== "nshard") {
                                accum[`#${key}`] = key
                            }
                            return accum
                        }, {})
                ),
                ExpressionAttributeValues:
                    Object.keys(ditemUpdates).reduce<{ [key: string]: AttributeValue }>((accum, key) => {
                        if (key.indexOf("PK") === -1 && key.indexOf("SK") === -1 && key !== "smetadata" && key !== "nmetadata" && key !== "nshard") {
                            accum[`:${key}`] = dexistingItem[key] || { NULL: true }  // value may not existed in item being updated
                        }
                        return accum
                    }, {})
            }
        }
    ]
    // build all updates by also examining refkeys
    const allTransactWriteItemList =
        itemTransactWriteItemList.concat(
            Object.keys(drefkeyUpdates).filter(r => drefkeyUpdates[r].S !== "__del__").reduce<TransactWriteItem[]>((accum, key) => {
                if (__item_refkeys.get(key)?.unique) {
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
            }, []))

    const params: TransactWriteItemsInput = {
        TransactItems: allTransactWriteItemList,
        ReturnConsumedCapacity: "TOTAL",
        ReturnItemCollectionMetrics: "SIZE",
        // ClientRequestToken: ringToken // TODO
    }

    delete itemUpdates.revisions
    try {
        const result = await ddbRequest(dynamoDbClient.transactWriteItems(params), itemUpdates.ringToken as string)
        !process.env.DEBUGGER || loginfo({ ringToken: itemUpdates.ringToken as string }, "====DDB==== TransactWriteItemsOutput: ", ppjson(result))
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