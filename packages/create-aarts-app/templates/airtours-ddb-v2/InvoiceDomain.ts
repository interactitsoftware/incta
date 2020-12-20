export const InvoiceDomain = 
`import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-ddb/interfaces"
import { InvoiceItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class InvoiceDomain extends BaseDynamoItemManager<InvoiceItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(invoice: InvoiceItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, InvoiceItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Create Invoice Failed\`
            throw new Error(\`\${errors.join(";;")}\`)
        } else {
            yield \`Successfuly created Invoice\`
            return invoice
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(invoice: InvoiceItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, InvoiceItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Update Invoice Failed\`
            throw new Error(\`\${errors.join(";;")}\`)
        } else {
            yield \`Successfuly updated Invoice\`
            return invoice
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(invoice: InvoiceItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, InvoiceItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield \`Delete Invoice Failed\`
            throw new Error(\`\${errors.join(";;")}\`)
        } else {
            yield \`Successfuly deleted Invoice\`
            return invoice
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

    public onCreate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onCreate logic in here or delete this method*/
        // console.log("ON CREATE TRIGGERED for " + __type)
    }
    public onUpdate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onUpdate logic in here or delete this method*/
        // console.log("ON UPDATE TRIGGERED for " + __type)
    }
}
`