import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { EraseDataItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager } from "aarts-types/interfaces"
import { dynamoDbClient, DB_NAME } from "aarts-dynamodb"
import { chunks } from "aarts-utils"
import { ScanOutput, WriteRequest } from "aws-sdk/clients/dynamodb"


export class EraseDataCommand extends BaseDynamoItemManager<EraseDataItem> {

    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: AartsPayload<EraseDataItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Start EraseData Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent): Promise<EraseDataItem> {

        await this.clearDynamo();

        return args.payload.arguments as EraseDataItem
    }

    private async clearDynamo() {
        let scanResult: ScanOutput = {}
        do {
            scanResult = await dynamoDbClient.scan({ TableName: DB_NAME, ExclusiveStartKey: scanResult.LastEvaluatedKey }).promise()
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
}
