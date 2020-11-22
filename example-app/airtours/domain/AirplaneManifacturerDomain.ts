import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneManifacturerItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneManifacturerDomain extends BaseDynamoItemManager<AirplaneManifacturerItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(airplaneManifacturer: AirplaneManifacturerItem, identity: IIdentity): AsyncGenerator<string, AirplaneManifacturerItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create AirplaneManifacturer Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created AirplaneManifacturer`
            return airplaneManifacturer
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(airplaneManifacturer: AirplaneManifacturerItem, identity: IIdentity): AsyncGenerator<string, AirplaneManifacturerItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update AirplaneManifacturer Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated AirplaneManifacturer`
            return airplaneManifacturer
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(airplaneManifacturer: AirplaneManifacturerItem, identity: IIdentity): AsyncGenerator<string, AirplaneManifacturerItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete AirplaneManifacturer Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted AirplaneManifacturer`
            return airplaneManifacturer
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
