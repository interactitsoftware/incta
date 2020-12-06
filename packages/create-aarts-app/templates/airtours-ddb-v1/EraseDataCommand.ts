export const EraseDataCommand = 
`
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { EraseDataItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { dynamoDbClient, DB_NAME } from "aarts-dynamodb"
import { chunks } from "aarts-utils"
import { ScanOutput, WriteRequest } from "aws-sdk/clients/dynamodb"


export class EraseDataCommand extends BaseDynamoItemManager<EraseDataItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: EraseDataItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, EraseDataItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start EraseData Failed'
            throw new Error(\`\${ringToken}: \${errors.join(";;")}\`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: EraseDataItem, identity: IIdentity, ringToken: string) : Promise<EraseDataItem> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        await this.clearDynamo()

        return proc
    }

    private async clearDynamo() {
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
}
`