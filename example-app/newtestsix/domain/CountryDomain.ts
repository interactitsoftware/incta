import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { CountryItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class CountryDomain extends BaseDynamoItemManager<CountryItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(country: CountryItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, CountryItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Country Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Country`
            return country
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(country: CountryItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, CountryItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Country Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Country`
            return country
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(country: CountryItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, CountryItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Country Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Country`
            return country
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
