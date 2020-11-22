import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneDomain extends BaseDynamoItemManager<AirplaneItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Airplane Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Airplane`
            return airplane
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Airplane Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Airplane`
            return airplane
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Airplane Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Airplane`
            return airplane
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
