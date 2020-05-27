'use strict'
// TODO keys (id / meta) as separate params, and a string for the update expression?
// https://github.com/aws/aws-sdk-js/blob/master/ts/dynamodb.ts
import { AWSError } from 'aws-sdk'
import DynamoDB, { AttributeMap, BatchGetItemInput, BatchGetItemOutput, BatchGetResponseMap, AttributeValue } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, toAttributeMapArray, fromAttributeMapArray, DB_NAME, toAttributeMap, fromAttributeMap, versionString } from './DynamoDbClient';
import { DynamoItemKey, ExistingDynamoItem, DynamoItem } from './BaseItemManager';
import { DdbQueryInput, DdbQueryOutput, DdbItemKey } from 'aarts-types/interfaces';


export const queryItems = <T extends DdbQueryInput>(ddbQueryPayload: T): Promise<DdbQueryOutput> => 
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
        },'')

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
                dkeyConditionExpression += ` and begins_with(#${ddbQueryPayload.rangeKeyName},:${ddbQueryPayload.rangeKeyName})`
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
        
        process.env.DEBUG || console.log("================================================")
        process.env.DEBUG || console.log("dqueryKeys ", dqueryKeys)
        process.env.DEBUG || console.log("keyConditionExpression ", dkeyConditionExpression)
        process.env.DEBUG || console.log("dfilter ", dfilter)
        process.env.DEBUG || console.log("dfilterExpression ", dfilterExpression)
        process.env.DEBUG || console.log("dexpressionAttributeNames ", dexpressionAttributeNames)
        process.env.DEBUG || console.log("dexpressionAttributeValues ", dexpressionAttributeValues)
        process.env.DEBUG || console.log("================================================")
        
        
        


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

        process.env.DEBUG || console.log("====DDB==== QueryOutput: ", {ConsumedCapacity: result.ConsumedCapacity, ScannedCount: result.ScannedCount})

        return resolve({items: fromAttributeMapArray(result.Items as AttributeMap[]), lastEvaluatedKey: fromAttributeMap<DdbItemKey>(result.LastEvaluatedKey as DynamoDB.Key), count: result.Count})
    })
})