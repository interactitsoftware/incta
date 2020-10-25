export const domainTemplate = 
`import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { ##ITEM##Item } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class ##ITEM##Domain extends BaseDynamoItemManager<##ITEM##Item> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: \`message here\` }] }
     */
    async *validateCreate(##ITEM_LOWERC##: ##ITEM##Item, identity: IIdentity): AsyncGenerator<AartsPayload, ##ITEM##Item, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: \`Create ##ITEM## Failed\` }, errors] }
            throw new Error(\`\${process.env.ringToken}: \${errors.join(";;")}\`)
        } else {
            yield { resultItems: [{ message: \`Successfuly created ##ITEM##\` }] }
            return ##ITEM_LOWERC##
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: \`message here\` }] }
     */
    async *validateUpdate(##ITEM_LOWERC##: ##ITEM##Item, identity: IIdentity): AsyncGenerator<AartsPayload, ##ITEM##Item, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: \`Update ##ITEM## Failed\` }, errors] }
            throw new Error(\`\${process.env.ringToken}: \${errors.join(";;")}\`)
        } else {
            yield { resultItems: [{ message: \`Successfuly updated ##ITEM##\` }] }
            return ##ITEM_LOWERC##
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: \`message here\` }] }
     */
    async *validateDelete(##ITEM_LOWERC##: ##ITEM##Item, identity: IIdentity): AsyncGenerator<AartsPayload, ##ITEM##Item, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: \`Delete ##ITEM## Failed\` }, errors] }
            throw new Error(\`\${process.env.ringToken}: \${errors.join(";;")}\`)
        } else {
            yield { resultItems: [{ message: \`Successfuly deleted ##ITEM##\` }] }
            return ##ITEM_LOWERC##
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: \`message here\` }] }
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbQueryInput, undefined> {
        return args
    }
    /**
     * Validating the get parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: \`message here\` }] }
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbGetInput, undefined> {
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
    async *validateStart(proc: AartsPayload<##ITEM##Item>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        proc.arguments.start_date = new Date().toISOString()

        const errors: string[] = []

        // here you can apply further domain logic on permissions, authorizations etc
        
        if (errors.length > 0) {
            yield { resultItems: [{ message: \`Start ##ITEM## Failed\` }, errors] }
            throw new Error(\`\${process.env.ringToken}: \${errors.join(";;")}\`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<##ITEM##Item> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        return args.payload.arguments as ##ITEM##Item
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
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {

        return { resultItems: [{}] }
    }
}
`