'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { batchGetItem, populateRefKeys } from './dynamodb-batchGetItem'
import DynamoDB, { AttributeMap, AttributeValue, QueryOutput } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, fromAttributeMapArray, DB_NAME, toAttributeMap, fromAttributeMap, ddbRequest } from './DynamoDbClient';
import { DdbQueryInput, DdbGSIItemKey, RefKey } from './interfaces';
import { loginfo, ppjson, versionString } from 'aarts-utils';
import { DynamoItem } from './DynamoItem';
import { DBQueryOutput } from 'aarts-types';

export const queryItems = async <T extends DdbQueryInput, TResult extends DynamoItem>(ddbQueryPayload: T): Promise<DBQueryOutput<TResult>> => {

    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "ddbQueryPayload ", ppjson(ddbQueryPayload))

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

        if (!!ddbQueryPayload["range"] && typeof ddbQueryPayload["range"] === "object") {
            if (!("min" in ddbQueryPayload["range"] || "max" in ddbQueryPayload["range"])) {
                throw new Error(`${ddbQueryPayload.ringToken}: range key for query is object but is missing the keys min,max`)
            }
            dexpressionAttributeValues[`:range_min`] = toAttributeMap(ddbQueryPayload.range).min
            dexpressionAttributeValues[`:range_max`] = toAttributeMap(ddbQueryPayload.range).max
            dkeyConditionExpression += ` and #${ddbQueryPayload.rangeKeyName} between :range_min and :range_max`


        } else {
            if (ddbQueryPayload.rangeKeyName.startsWith("n")) {
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

    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "dqueryKeys ", ppjson(dqueryKeys))
    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "keyConditionExpression ", ppjson(dkeyConditionExpression))
    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "dfilter ", ppjson(dfilter))
    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "dfilterExpression ", ppjson(dfilterExpression))
    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "dexpressionAttributeNames ", ppjson(dexpressionAttributeNames))
    !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "dexpressionAttributeValues ", ppjson(dexpressionAttributeValues))

    const params: DynamoDB.QueryInput = {
        TableName: DB_NAME,
        IndexName: ddbQueryPayload.ddbIndex,
        Limit: ddbQueryPayload.limit,
        ExclusiveStartKey: !!ddbQueryPayload.paginationToken ? toAttributeMap(ddbQueryPayload.paginationToken): undefined,
        ReturnConsumedCapacity: 'TOTAL',
        KeyConditionExpression: dkeyConditionExpression,
        ExpressionAttributeNames: dexpressionAttributeNames,
        ExpressionAttributeValues: dexpressionAttributeValues,
        FilterExpression: dfilterExpression
    }

    try {
        const dynamoResult = await ddbRequest(dynamoDbClient.query(params), ddbQueryPayload.ringToken)
        !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "====DDB==== QueryOutput: ", ppjson(dynamoResult))
        let output = { 
            items: fromAttributeMapArray((dynamoResult as QueryOutput).Items as AttributeMap[]) as TResult[],
            nextPage: fromAttributeMap<DdbGSIItemKey>((dynamoResult as QueryOutput).LastEvaluatedKey as DynamoDB.Key)
        }

        if (!!ddbQueryPayload.ddbIndex && !!dynamoResult && output.items.length > 0) {
            if (!process.env.copyEntireItemToGsis) {
                !process.env.DEBUGGER || loginfo({ringToken: ddbQueryPayload.ringToken}, "calling batch get item with", ppjson({
                    pks: output.items.map(r => { return { id: r.id, meta: `${versionString(0)}|${r.id}` } }),
                    loadPeersLevel: ddbQueryPayload.loadPeersLevel,
                    peersPropsToLoad: ddbQueryPayload.peersPropsToLoad,
                    projectionExpression: ddbQueryPayload.projectionExpression,
                    ringToken: ddbQueryPayload.ringToken
                }))
                output.items = (await batchGetItem({
                    pks: output.items.map(r => { return { id: r.id, meta: `${versionString(0)}|${r.id}` } }),
                    loadPeersLevel: ddbQueryPayload.loadPeersLevel,
                    peersPropsToLoad: ddbQueryPayload.peersPropsToLoad,
                    projectionExpression: ddbQueryPayload.projectionExpression,
                    ringToken: ddbQueryPayload.ringToken
                })).items as TResult[]
            } else {
                for (let resultItem of output.items) {
                    await populateRefKeys(resultItem, ddbQueryPayload.loadPeersLevel, ddbQueryPayload.peersPropsToLoad, ddbQueryPayload.projectionExpression, ddbQueryPayload.ringToken)
                }
            }
        } else if (!!output && output.items.length > 0) {
            // TODO promise.all !!!
            for (let resultItem of output.items) {
                await populateRefKeys(resultItem, ddbQueryPayload.loadPeersLevel, ddbQueryPayload.peersPropsToLoad, ddbQueryPayload.projectionExpression, ddbQueryPayload.ringToken)
            }
        }

        return output

    } catch (err) {
        throw new Error(ppjson({ request: params, error: err }))
    }
}

