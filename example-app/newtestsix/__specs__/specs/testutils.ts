import { chunks } from "aarts-utils"
import { WriteRequest } from "aws-sdk/clients/dynamodb"
import { dynamoDbClient, DB_NAME } from "aarts-dynamodb";

export const clearDynamo = async () => {
    let scanResult
    do {
        let scanResult = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
        const items = scanResult.Items && chunks(scanResult.Items, 25)
        if (items) {
            for (const chunk of items) {
                await dynamoDbClient.batchWriteItem({
                    RequestItems: {
                        [DB_NAME]: chunk.reduce<WriteRequest[]>((accum, item) => {
                            accum.push({
                                DeleteRequest: {
                                    Key: { id: { S: item.id.S }, meta: { S: item.meta.S } }
                                }
                            })
                            return accum
                        }, [])
                    }
                }).promise()
            }
        }

        scanResult = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()

    } while (scanResult && scanResult.LastEvaluatedKey)
}
