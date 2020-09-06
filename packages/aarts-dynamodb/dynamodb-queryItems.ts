'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { AWSError } from 'aws-sdk'
import DynamoDB, { AttributeMap, AttributeValue } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, fromAttributeMapArray, DB_NAME, toAttributeMap, fromAttributeMap, versionString } from './DynamoDbClient';
import { DynamoItem } from './BaseItemManager';
import { DdbQueryInput, DdbQueryOutput, DdbGSIItemKey } from './interfaces';


export const queryItems = <T extends DdbQueryInput, TResult extends DynamoItem>(ddbQueryPayload: T): Promise<DdbQueryOutput<TResult>> => 
    new Promise((resolve, reject) => {
    
        const dqueryKeys = toAttributeMap({
            pk: ddbQueryPayload.pk,
            range:ddbQueryPayload.range
        })
        let dkeyConditionExpression = `#${ddbQueryPayload.primaryKeyName} = :${ddbQueryPayload.primaryKeyName}`

        const dfilter = ddbQueryPayload.filter && ddbQueryPayload.filter.map(filter => toAttributeMap(filter))
        const dfilterExpression = dfilter && dfilter.reduce<string>((accum, f)=>{
            accum+= `#${f.key.S} ${f.predicate.S} :${f.key.S}`
            return accum
        },"")

        const dexpressionAttributeNames = {[`#${ddbQueryPayload.primaryKeyName}`]: ddbQueryPayload.primaryKeyName}
        

        const dexpressionAttributeValues = {[`:${ddbQueryPayload.primaryKeyName}`]: dqueryKeys.pk}
        if ("range" in ddbQueryPayload) {

            dexpressionAttributeNames[`#${ddbQueryPayload.rangeKeyName}`] = ddbQueryPayload.rangeKeyName

            if (typeof ddbQueryPayload["range"] === "object") {
                if (!("min" in ddbQueryPayload["range"] || "max" in ddbQueryPayload["range"])) {
                    throw new Error("range key for query is object but is missing the keys min,max")
                }
                dexpressionAttributeValues[`:range_min`] = toAttributeMap(ddbQueryPayload.range).min
                dexpressionAttributeValues[`:range_max`] = toAttributeMap(ddbQueryPayload.range).max
                dkeyConditionExpression += ` and #${ddbQueryPayload.rangeKeyName} between :range_min and :range_max`


            } else {
                if (ddbQueryPayload.rangeKeyName === "nmetadata"){
                    dkeyConditionExpression += ` and #${ddbQueryPayload.rangeKeyName} = :${ddbQueryPayload.rangeKeyName}`
                } else {
                    dkeyConditionExpression += ` and begins_with(#${ddbQueryPayload.rangeKeyName},:${ddbQueryPayload.rangeKeyName})`
                }
                
                dexpressionAttributeValues[`:${ddbQueryPayload.rangeKeyName}`] = dqueryKeys.range
            }
        }
        

        if ("filter" in ddbQueryPayload) {
            Object.assign(dexpressionAttributeNames, 
                dfilter && dfilter.reduce<Record<string, string>>((accum, f)=>{
                //@ts-ignore
                accum[`#${f.key.S}`] = f.key.S
                return accum
            },{}))

            Object.assign(dexpressionAttributeValues,
                dfilter && dfilter.reduce<Record<string, AttributeValue>>((accum, f)=>{
                    accum[`:${f.key.S}`] = f.value
                    return accum
                },{}))
        }
        
        process.env.DEBUG && console.log("================================================")
        process.env.DEBUG && console.log("dqueryKeys ", dqueryKeys)
        process.env.DEBUG && console.log("keyConditionExpression ", dkeyConditionExpression)
        process.env.DEBUG && console.log("dfilter ", dfilter)
        process.env.DEBUG && console.log("dfilterExpression ", dfilterExpression)
        process.env.DEBUG && console.log("dexpressionAttributeNames ", dexpressionAttributeNames)
        process.env.DEBUG && console.log("dexpressionAttributeValues ", dexpressionAttributeValues)
        process.env.DEBUG && console.log("================================================")
        
        const params: DynamoDB.QueryInput = {
        TableName: DB_NAME,
        IndexName: ddbQueryPayload.ddbIndex,
        Limit: ddbQueryPayload.limit,
        ExclusiveStartKey: toAttributeMap(ddbQueryPayload.paginationToken),
        ReturnConsumedCapacity: 'TOTAL', 
        KeyConditionExpression: dkeyConditionExpression,
        ExpressionAttributeNames: dexpressionAttributeNames,
        ExpressionAttributeValues:dexpressionAttributeValues,
        FilterExpression: dfilterExpression

    }

    dynamoDbClient.query(params, (error: AWSError, result: DynamoDB.QueryOutput) => {
        if (error) {
            console.log(error)
            return reject(error)
        }

        process.env.DEBUG && console.log("====DDB==== QueryOutput: ", {Items: result.Items, Count: result.Count, ConsumedCapacity: result.ConsumedCapacity, ScannedCount: result.ScannedCount})

        return resolve({items: (fromAttributeMapArray(result.Items as AttributeMap[]) as TResult[]), lastEvaluatedKey: fromAttributeMap<DdbGSIItemKey>(result.LastEvaluatedKey as DynamoDB.Key), count: result.Count})
    })
})