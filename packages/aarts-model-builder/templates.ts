export const domainTemplate = 
`import { BaseDynamoItemManager } from "##DDB_MANAGER_LIB##/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "##DDB_LIB##/interfaces"
import { ##ITEM##Item } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class ##ITEM##Domain extends BaseDynamoItemManager<##ITEM##Item> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(##ITEM_LOWERC##: ##ITEM##Item, identity: IIdentity, ringToken: string): AsyncGenerator<string, ##ITEM##Item, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Create ##ITEM## Failed\`
            throw new Error(\`\${errors.join(";;")}\`)
        } else {
            yield \`Successfuly created ##ITEM##\`
            return ##ITEM_LOWERC##
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(##ITEM_LOWERC##: ##ITEM##Item, identity: IIdentity, ringToken: string): AsyncGenerator<string, ##ITEM##Item, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Update ##ITEM## Failed\`
            throw new Error(\`\${errors.join(";;")}\`)
        } else {
            yield \`Successfuly updated ##ITEM##\`
            return ##ITEM_LOWERC##
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(##ITEM_LOWERC##: ##ITEM##Item, identity: IIdentity, ringToken: string): AsyncGenerator<string, ##ITEM##Item, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Delete ##ITEM## Failed\`
            throw new Error(\`\${errors.join(";;")}\`)
        } else {
            yield \`Successfuly deleted ##ITEM##\`
            return ##ITEM_LOWERC##
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity, ringToken: string): AsyncGenerator<string, DdbQueryInput, undefined> {
        return args
    }
    /**
     * Validating the get parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity, ringToken: string): AsyncGenerator<string, DdbGetInput, undefined> {
        return args
    }
}
`

export const commandTemplate = 
`import { BaseDynamoItemManager } from "##DDB_MANAGER_LIB##/BaseItemManager"
import { ##ITEM##Item } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"


export class ##ITEM##Command extends BaseDynamoItemManager<##ITEM##Item> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: ##ITEM##Item, identity: IIdentity, ringToken: string): AsyncGenerator<string, ##ITEM##Item, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Start ##ITEM## Failed\`
            throw new Error(\`\${ringToken}: \${errors.join(";;")}\`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: ##ITEM##Item, identity: IIdentity, ringToken: string) : Promise<##ITEM##Item> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        return proc
    }
}
`

export const queryTemplate = 
`
import { BaseDynamoItemManager } from "##DDB_MANAGER_LIB##/BaseItemManager"
import { ##ITEM##Item } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class ##ITEM##Query extends BaseDynamoItemManager<##ITEM##Item> {
    // Queries are BaseDynamoItemManagers with overwritten query method. Code will not call validateQuery and baseValidateQuery in this case
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload<##ITEM##Item>, undefined> {

        return { result: { items:[], nextPage: null } }
    }
}
`

export const testutils =
`import { chunks } from "aarts-utils"
import { WriteRequest } from "aws-sdk/clients/dynamodb"
import { dynamoDbClient, DB_NAME } from "##DDB_LIB##";

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
`

export const getDdbLibName = (modelVerion: number) : string => {
    switch(modelVerion) {
        case 1: return "aarts-dynamodb"
        case 2: return "aarts-ddb"
        default: return "aarts-dynamodb"
    }
}

export const getDdbManagerLibName = (modelVerion: number) : string => {
    switch(modelVerion) {
        case 1: return "aarts-item-manager"
        case 2: return "aarts-ddb-manager"
        default: return "aarts-item-manager"
    }
}

export const getDdbEventsLibName = (modelVerion: number) : string => {
    switch(modelVerion) {
        case 1: return "aarts-dynamodb-events"
        case 2: return "aarts-ddb-events"
        default: return "aarts-dynamodb-events"
    }
}