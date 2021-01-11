import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-ddb/interfaces"
import { AirplaneItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneDomain extends BaseDynamoItemManager<AirplaneItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(airplane: AirplaneItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(airplane: AirplaneItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(airplane: AirplaneItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneItem, undefined> {
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
