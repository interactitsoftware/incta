import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { TouristSeasonItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class TouristSeasonDomain extends BaseDynamoItemManager<TouristSeasonItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateCreate(touristSeason: TouristSeasonItem, identity: IIdentity): AsyncGenerator<string, TouristSeasonItem, undefined> {
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
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateUpdate(touristSeason: TouristSeasonItem, identity: IIdentity): AsyncGenerator<string, TouristSeasonItem, undefined> {
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
     * Yielded objects should be of the form:
     * yield { result: [{ message: `message here` }] }
     */
    async *validateDelete(touristSeason: TouristSeasonItem, identity: IIdentity): AsyncGenerator<string, TouristSeasonItem, undefined> {
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
