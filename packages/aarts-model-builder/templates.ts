export const domainTemplate = 
`import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
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
`import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
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
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
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