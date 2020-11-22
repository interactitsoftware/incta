import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { CountryItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class CountryDomain extends BaseDynamoItemManager<CountryItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(country: CountryItem, identity: IIdentity): AsyncGenerator<string, CountryItem, undefined> {
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
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(country: CountryItem, identity: IIdentity): AsyncGenerator<string, CountryItem, undefined> {
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
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(country: CountryItem, identity: IIdentity): AsyncGenerator<string, CountryItem, undefined> {
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
