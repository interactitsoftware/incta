import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { chunks } from "aarts-types/utils"
import { dynamoDbClient, DB_NAME } from "aarts-dynamodb/DynamoDbClient"
import { AartsEvent, IIdentity } from "aarts-types/interfaces";
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { AppSyncEvent } from "aarts-eb-types/aartsEBUtil";
import { EraseDataItem } from "../_DynamoItems";
import { WriteRequest } from "aws-sdk/clients/dynamodb";

export class EraseData {

    public total_events: number = 0
    public succsess?: number
    public error?: number
    public processed_events?: boolean
    public start_date?: number
    public end_date?: number

    private publishAndRegister(event: AppSyncEvent) {
        dispatcher(event)
        this.total_events++
    }
    public async start(__type: string, args: AartsEvent) {
        // this.start_date = Date.now()

        await clearDynamo();

        return null; // ->> when we are erasing dynamo we want a clear dynamo db so we are not saving state of this procedure
    }
}

export class EraseDataManager extends BaseDynamoItemManager<EraseDataItem> {

    async *validateStart(proc: EraseDataItem, identity: IIdentity): AsyncGenerator<string, EraseDataItem, undefined> {
        const errors: string[] = []
        // can apply some domain logic on permissions, authorizations etc
        return proc // do nothing for now
    }

}

const clearDynamo = async () => {
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