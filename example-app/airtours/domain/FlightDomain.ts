import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { FlightItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class FlightDomain extends BaseDynamoItemManager<FlightItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateCreate(flight: FlightItem, identity: IIdentity): AsyncGenerator<string, FlightItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Create Flight Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly created Flight`
            return flight
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateUpdate(flight: FlightItem, identity: IIdentity): AsyncGenerator<string, FlightItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Flight Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Flight`
            return flight
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield `message here`
     */
    async *validateDelete(flight: FlightItem, identity: IIdentity): AsyncGenerator<string, FlightItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Flight Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Flight`
            return flight
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
