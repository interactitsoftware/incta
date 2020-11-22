import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneManifacturerItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneManifacturerDomain extends BaseDynamoItemManager<AirplaneManifacturerItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(airplaneManifacturer: AirplaneManifacturerItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneManifacturerItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(airplaneManifacturer: AirplaneManifacturerItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneManifacturerItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(airplaneManifacturer: AirplaneManifacturerItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneManifacturerItem, undefined> {
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
