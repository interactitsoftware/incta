import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirportItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirportDomain extends BaseDynamoItemManager<AirportItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(airport: AirportItem, identity: IIdentity): AsyncGenerator<string, AirportItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Airport Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Airport`
            return airport
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(airport: AirportItem, identity: IIdentity): AsyncGenerator<string, AirportItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Airport Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Airport`
            return airport
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(airport: AirportItem, identity: IIdentity): AsyncGenerator<string, AirportItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Airport Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Airport`
            return airport
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
