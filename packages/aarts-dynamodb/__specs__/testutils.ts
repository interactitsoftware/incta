import { DomainItem, DynamoItem } from "../BaseItemManager"
import { dynamoDbClient, DB_NAME } from "../DynamoDbClient"
import { chunks } from "aarts-types/utils"
import { WriteRequest } from "aws-sdk/clients/dynamodb"

export const stripCreatedUpdatedDates =  (obj: DynamoItem & DomainItem) : Record<string, any> => {
    delete obj.date_created
    delete obj.date_updated
    return obj
}

export const clearDynamo = async () =>{
    let scanResult
    do {
        let scanResult = await dynamoDbClient.scan({TableName: DB_NAME}).promise()
        const items = scanResult.Items && chunks(scanResult.Items, 25)
        if (items) {
            for (const chunk of items) {
                await dynamoDbClient.batchWriteItem({
                    RequestItems: {
                        [DB_NAME] : chunk.reduce<WriteRequest[]>((accum, item) => {
                            accum.push({
                                DeleteRequest: {
                                    Key: {id: {S: item.id.S}, meta: {S:item.meta.S}}
                                }
                            })
                            return accum
                        }, [])
                    }
                }).promise()
            }
        }

        scanResult = await dynamoDbClient.scan({TableName: DB_NAME}).promise()

    } while(scanResult && scanResult.LastEvaluatedKey)
  }

  export const getBy_meta__smetadata = (meta:string, smetadata:string) => dynamoDbClient.query(
    {
      TableName: DB_NAME, IndexName: "meta__smetadata",
      KeyConditionExpression: "#meta=:meta and #smetadata = :smetadata",
      ExpressionAttributeValues: { ":meta": { S: meta }, ":smetadata": { S: smetadata } },
      ExpressionAttributeNames: { "#meta": "meta", "#smetadata": "smetadata" }
    })
  export const getBy_meta__nmetadata = (meta:string, nmetadata:number) => dynamoDbClient.query(
    {
      TableName: DB_NAME, IndexName: "meta__nmetadata",
      KeyConditionExpression: "#meta=:meta and #nmetadata = :nmetadata",
      ExpressionAttributeValues: { ":meta": { S: meta }, ":nmetadata": { N: `${nmetadata}` } },
      ExpressionAttributeNames: { "#meta": "meta", "#nmetadata": "nmetadata" }
    })
  export const getBy_smetadata__meta = (meta:string, smetadata:string) => {}
  export const getBy_nmetadata__meta = (meta:string, smetadata:string) => {}