'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { DynamoDB, AWSError } from 'aws-sdk'
import { AttributeValue, TransactWriteItemsInput, AttributeName, TransactWriteItemsOutput, TransactWriteItem, TransactWriteItemList } from 'aws-sdk/clients/dynamodb'
import { ExistingDynamoItem } from './BaseItemManager';
import { dynamoDbClient, DB_NAME, toAttributeMap, ensureOnlyNewKeyUpdates, versionString, deletedVersionString } from './DynamoDbClient';


export const transactDeleteItem = <T extends ExistingDynamoItem>(existingItem: T, __item_refkeys: string[]): Promise<T> =>
    new Promise((resolve, reject) => {
        let itemUpdates = {id: existingItem.id, meta: existingItem.meta} //i.e all items are to be updated, when deleting

        const drevisionsUpdates = toAttributeMap(
            { "inc_revision": 1, "start_revision": 0 })
        const ditemUpdates: DynamoDB.AttributeMap = toAttributeMap(
            ensureOnlyNewKeyUpdates(existingItem, itemUpdates)
        )
        const dexistingItemkey = { id: { S: itemUpdates.id }, meta: { S: itemUpdates.meta } };
        const dexistingItem = toAttributeMap(existingItem)

        // NNO CHECK FOR REVISIONS IN A DELETE
        // if (Object.keys(ditemUpdates).length === 1 && "revisions" in ditemUpdates) {
        //     // no new updates, only old revision passed
        //     throw new Error(`no new updates, only revision passed for id[${existingItem.id}]`)
        // }

        //#region DEBUG msg
        process.env.DEBUG || console.log("================================================")
        process.env.DEBUG || console.log('existing item ', existingItem)
        process.env.DEBUG || console.log('itemUpdates ', itemUpdates)
        process.env.DEBUG || console.log("drevisionsUpdates ", drevisionsUpdates)
        process.env.DEBUG || console.log("ditemUpdates ", ditemUpdates)
        process.env.DEBUG || console.log("dexistingItemkey ", dexistingItemkey)
        process.env.DEBUG || console.log("================================================")
        //#endregion

        const updateExpr = `set #revisions = if_not_exists(#revisions, :start_revision) + :inc_revision, ${Object.keys(ditemUpdates).filter(uk => uk != "revisions").map(uk => `#${uk} = :${uk}`).join(", ")}`
        const updateExprHistory = `set ${Object.keys(dexistingItem).filter(diu => diu !== "id" && diu !== "meta").map(uk => `#${uk} = :${uk}`).join(", ")}`
        console.log(updateExpr)

        const itemTransactWriteItemList: TransactWriteItemList = [
            {
                Delete: {
                    // ConditionExpression: `#revisions = :revisions`,
                    // ExpressionAttributeNames: {"#id": "id", "#meta": "meta"},
                    // ExpressionAttributeValues: {":id": ditemUpdates["id"], ":meta": ditemUpdates["meta"]},

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
                        meta: { S: `${deletedVersionString(++existingItem.revisions)}|${existingItem.item_type}` },
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
            if (__item_refkeys && __item_refkeys.indexOf(key) > -1) {
                accum.push({
                    Delete: {
                        Key: { id: dexistingItemkey.id, meta: { S: `${existingItem.item_type}}${key}` } },
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
            itemUpdates.meta = `${deletedVersionString(++existingItem.revisions)}|${existingItem.item_type}`
            return resolve(Object.assign(existingItem, itemUpdates))
        })
    })