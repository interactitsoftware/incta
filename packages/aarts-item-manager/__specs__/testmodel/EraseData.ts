import { chunks } from "aarts-utils"
import { AartsEvent, AartsPayload } from "aarts-types/interfaces";
import { WriteRequest, ScanOutput } from "aws-sdk/clients/dynamodb";
import { _specs_EraseDataItem } from "./_DynamoItems";
import { BaseDynamoItemManager } from "../../BaseItemManager";
import { DB_NAME, dynamoDbClient } from "aarts-dynamodb";

export class _specs_EraseData {

    // todo employ these props, wrap clearDynamo in try catch if error record it in the props, so it goes to dynamo for auditing
    public total_events: number = 0
    public succsess?: number
    public error?: number
    public processed_events?: boolean
    public start_date?: number
    public end_date?: number

    public async start(__type: string, args: AartsEvent) {

        await clearDynamo();

        return null; // ->> when we are erasing dynamo we want a clear dynamo db so we are not saving state of this procedure
    }
}

const clearDynamo = async () => {
    let scanResult : ScanOutput = {}
    do {
        scanResult = await dynamoDbClient.scan({ TableName: DB_NAME, ExclusiveStartKey: scanResult.LastEvaluatedKey}).promise()
        let items = scanResult.Items && chunks(scanResult.Items, 25)
        if (items && items.length > 0) {
            for (const chunk of items) {
                await dynamoDbClient.batchWriteItem({
                    RequestItems: {
                        [DB_NAME]: chunk.reduce<WriteRequest[]>((accum, item) => {
                            accum.push({
                                DeleteRequest: {
                                    Key: { id: { S: item["id"].S }, meta: { S: item["meta"].S } }
                                }
                            })
                            return accum
                        }, [])
                    }
                }).promise()
            }
        }
    } while (scanResult && scanResult.LastEvaluatedKey)
}