import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { InvoiceItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class InvoiceDomain extends BaseDynamoItemManager<InvoiceItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(invoice: InvoiceItem, identity: IIdentity): AsyncGenerator<string, InvoiceItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Invoice Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Invoice`
            return invoice
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(invoice: InvoiceItem, identity: IIdentity): AsyncGenerator<string, InvoiceItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Invoice Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Invoice`
            return invoice
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(invoice: InvoiceItem, identity: IIdentity): AsyncGenerator<string, InvoiceItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Invoice Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Invoice`
            return invoice
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<string, DdbQueryInput, undefined> {
        return args
    }
    /**
     * Validating the get parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity): AsyncGenerator<string, DdbGetInput, undefined> {
        return args
    }
}
