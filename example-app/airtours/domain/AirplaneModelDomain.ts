import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneModelItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneModelDomain extends BaseDynamoItemManager<AirplaneModelItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(airplaneModel: AirplaneModelItem, identity: IIdentity): AsyncGenerator<string, AirplaneModelItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create AirplaneModel Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created AirplaneModel`
            return airplaneModel
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(airplaneModel: AirplaneModelItem, identity: IIdentity): AsyncGenerator<string, AirplaneModelItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update AirplaneModel Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated AirplaneModel`
            return airplaneModel
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(airplaneModel: AirplaneModelItem, identity: IIdentity): AsyncGenerator<string, AirplaneModelItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete AirplaneModel Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted AirplaneModel`
            return airplaneModel
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
