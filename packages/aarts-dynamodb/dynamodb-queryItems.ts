'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { batchGetItem, populateRefKeys } from './dynamodb-batchGetItem'
import DynamoDB, { AttributeMap, AttributeValue, QueryOutput } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, fromAttributeMapArray, DB_NAME, toAttributeMap, fromAttributeMap, ddbRequest } from './DynamoDbClient';
import { DynamoItem } from './BaseItemManager';
import { DdbQueryInput, DdbQueryOutput, DdbGSIItemKey, RefKey } from './interfaces';
import { loginfo, ppjson, versionString } from 'aarts-utils/utils';

export const queryItems = async <T extends DdbQueryInput, TResult extends DynamoItem>(ddbQueryPayload: T): Promise<DdbQueryOutput<TResult>> => {

    if (ddbQueryPayload.loadPeersLevel === undefined) {
        ddbQueryPayload.loadPeersLevel = 0 // default behaviour, do not load peers if not requested
    }

    const dqueryKeys = toAttributeMap({
        pk: ddbQueryPayload.pk,
        range: ddbQueryPayload.range
    })
    let dkeyConditionExpression = `#${ddbQueryPayload.primaryKeyName} = :${ddbQueryPayload.primaryKeyName}`

    const dfilter = ddbQueryPayload.filter && ddbQueryPayload.filter.map(filter => toAttributeMap(filter))
    const dfilterExpression = dfilter && dfilter.reduce<string>((accum, f) => {
        accum += `#${f.key.S} ${f.predicate.S} :${f.key.S}`
        return accum
    }, "")

    const dexpressionAttributeNames = { [`#${ddbQueryPayload.primaryKeyName}`]: ddbQueryPayload.primaryKeyName }


    const dexpressionAttributeValues = { [`:${ddbQueryPayload.primaryKeyName}`]: dqueryKeys.pk }
    if ("range" in ddbQueryPayload) {

        dexpressionAttributeNames[`#${ddbQueryPayload.rangeKeyName}`] = ddbQueryPayload.rangeKeyName

        if (typeof ddbQueryPayload["range"] === "object") {
            if (!("min" in ddbQueryPayload["range"] || "max" in ddbQueryPayload["range"])) {
                throw new Error(`${process.env.ringToken}: range key for query is object but is missing the keys min,max`)
            }
            dexpressionAttributeValues[`:range_min`] = toAttributeMap(ddbQueryPayload.range).min
            dexpressionAttributeValues[`:range_max`] = toAttributeMap(ddbQueryPayload.range).max
            dkeyConditionExpression += ` and #${ddbQueryPayload.rangeKeyName} between :range_min and :range_max`


        } else {
            if (ddbQueryPayload.rangeKeyName === "nmetadata") {
                dkeyConditionExpression += ` and #${ddbQueryPayload.rangeKeyName} = :${ddbQueryPayload.rangeKeyName}`
            } else {
                dkeyConditionExpression += ` and begins_with(#${ddbQueryPayload.rangeKeyName},:${ddbQueryPayload.rangeKeyName})`
            }

            dexpressionAttributeValues[`:${ddbQueryPayload.rangeKeyName}`] = dqueryKeys.range
        }
    }


    if ("filter" in ddbQueryPayload) {
        Object.assign(dexpressionAttributeNames,
            dfilter && dfilter.reduce<Record<string, string>>((accum, f) => {
                //@ts-ignore
                accum[`#${f.key.S}`] = f.key.S
                return accum
            }, {}))

        Object.assign(dexpressionAttributeValues,
            dfilter && dfilter.reduce<Record<string, AttributeValue>>((accum, f) => {
                accum[`:${f.key.S}`] = f.value
                return accum
            }, {}))
    }

    !process.env.DEBUGGER || loginfo("================================================")
    !process.env.DEBUGGER || loginfo("dqueryKeys ", dqueryKeys)
    !process.env.DEBUGGER || loginfo("keyConditionExpression ", dkeyConditionExpression)
    !process.env.DEBUGGER || loginfo("dfilter ", dfilter)
    !process.env.DEBUGGER || loginfo("dfilterExpression ", dfilterExpression)
    !process.env.DEBUGGER || loginfo("dexpressionAttributeNames ", dexpressionAttributeNames)
    !process.env.DEBUGGER || loginfo("dexpressionAttributeValues ", dexpressionAttributeValues)
    !process.env.DEBUGGER || loginfo("================================================")

    const params: DynamoDB.QueryInput = {
        TableName: DB_NAME,
        IndexName: ddbQueryPayload.ddbIndex,
        Limit: ddbQueryPayload.limit,
        ExclusiveStartKey: toAttributeMap(ddbQueryPayload.paginationToken),
        ReturnConsumedCapacity: 'TOTAL',
        KeyConditionExpression: dkeyConditionExpression,
        ExpressionAttributeNames: dexpressionAttributeNames,
        ExpressionAttributeValues: dexpressionAttributeValues,
        FilterExpression: dfilterExpression

    }

    try {
        const result = await ddbRequest(dynamoDbClient.query(params))
        !process.env.DEBUGGER || loginfo("====DDB==== QueryOutput: ", ppjson(result))
        let resultItems = fromAttributeMapArray((result as QueryOutput).Items as AttributeMap[]) as DynamoItem[]

        if (!!ddbQueryPayload.ddbIndex && !!resultItems && resultItems.length > 0) {
            if (!process.env.copyEntireItemToGsis) {
                console.log("calling batch get item with", {
                    pks: resultItems.map(r => { return { id: r.id, meta: `${versionString(0)}|${r.id.substr(0, r.id.indexOf("|"))}` } }),
                    loadPeersLevel: ddbQueryPayload.loadPeersLevel,
                    peersPropsToLoad: ddbQueryPayload.peersPropsToLoad,
                    projectionExpression: ddbQueryPayload.projectionExpression
                })
                resultItems = await batchGetItem({
                    pks: resultItems.map(r => { return { id: r.id, meta: `${versionString(0)}|${r.id.substr(0, r.id.indexOf("|"))}` } }),
                    loadPeersLevel: ddbQueryPayload.loadPeersLevel,
                    peersPropsToLoad: ddbQueryPayload.peersPropsToLoad,
                    projectionExpression: ddbQueryPayload.projectionExpression
                })
            } else {
                for (let resultItem of resultItems) {
                    await populateRefKeys(resultItem, ddbQueryPayload.loadPeersLevel, ddbQueryPayload.peersPropsToLoad, ddbQueryPayload.projectionExpression)
                }
            }
        } else if (!!resultItems && resultItems.length > 0) {
            for (let resultItem of resultItems) {
                await populateRefKeys(resultItem, ddbQueryPayload.loadPeersLevel, ddbQueryPayload.peersPropsToLoad, ddbQueryPayload.projectionExpression)
            }
        }

        return { items: resultItems as TResult[], lastEvaluatedKey: fromAttributeMap<DdbGSIItemKey>((result as QueryOutput).LastEvaluatedKey as DynamoDB.Key), count: (result as QueryOutput).Count }

    } catch (err) {
        throw new Error(ppjson({ request: params, error: err }))
    }
}

