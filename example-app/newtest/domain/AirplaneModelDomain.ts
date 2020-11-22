import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneModelItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneModelDomain extends BaseDynamoItemManager<AirplaneModelItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(airplaneModel: AirplaneModelItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneModelItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(airplaneModel: AirplaneModelItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneModelItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(airplaneModel: AirplaneModelItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneModelItem, undefined> {
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
