import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { TouristItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class TouristDomain extends BaseDynamoItemManager<TouristItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(tourist: TouristItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Tourist Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Tourist`
            return tourist
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(tourist: TouristItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Tourist Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Tourist`
            return tourist
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(tourist: TouristItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Tourist Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Tourist`
            return tourist
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
