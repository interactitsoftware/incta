import { chunks, ppjson } from "aarts-utils"
import { AartsEvent, AartsPayload } from "aarts-types/interfaces";
import { WriteRequest, ScanOutput } from "aws-sdk/clients/dynamodb";
import { _specs_EraseDataItem } from "./_DynamoItems";
import { BaseDynamoItemManager, DynamoCommandItem } from "../../BaseItemManager";
import { DB_NAME, dynamoDbClient } from "aarts-dynamodb";

export class _specs_EraseData  extends DynamoCommandItem {
    
}

export class _specs_EraseDataManager extends BaseDynamoItemManager<_specs_EraseDataItem> {

    async *validateStart(proc: AartsPayload<_specs_EraseDataItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        console.log("VALIDATE STARTING " + ppjson(proc))
        const errors: string[] = []
        // can apply further domain logic on permissions, authorizations etc
        // if this method returns without throwing error, the execute method will be called 

        proc.arguments.start_date = new Date().toISOString()
        return proc
    }

    async execute(__type: string, args: AartsEvent): Promise<_specs_EraseDataItem> {

        await clearDynamo()

        return args.payload.arguments as _specs_EraseDataItem
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