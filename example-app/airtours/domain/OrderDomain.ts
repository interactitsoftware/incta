import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { OrderItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class OrderDomain extends BaseDynamoItemManager<OrderItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateCreate(order: OrderItem, identity: IIdentity): AsyncGenerator<string, OrderItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Order Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Order`
            return order
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateUpdate(order: OrderItem, identity: IIdentity): AsyncGenerator<string, OrderItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Order Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Order`
            return order
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateDelete(order: OrderItem, identity: IIdentity): AsyncGenerator<string, OrderItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Order Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Order`
            return order
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<string, DdbQueryInput, undefined> {
        return args
    }
    /**
     * Validating the get parameters and user identity.
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity): AsyncGenerator<string, DdbGetInput, undefined> {
        return args
    }
}
