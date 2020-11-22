import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { TouristSeasonItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class TouristSeasonDomain extends BaseDynamoItemManager<TouristSeasonItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(touristSeason: TouristSeasonItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristSeasonItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create TouristSeason Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created TouristSeason`
            return touristSeason
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(touristSeason: TouristSeasonItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristSeasonItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update TouristSeason Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated TouristSeason`
            return touristSeason
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(touristSeason: TouristSeasonItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristSeasonItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete TouristSeason Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted TouristSeason`
            return touristSeason
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
