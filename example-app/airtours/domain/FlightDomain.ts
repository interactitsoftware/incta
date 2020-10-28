import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { FlightItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class FlightDomain extends BaseDynamoItemManager<FlightItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateCreate(flight: FlightItem, identity: IIdentity): AsyncGenerator<AartsPayload, FlightItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Create Flight Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly created Flight` }] }
            return flight
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateUpdate(flight: FlightItem, identity: IIdentity): AsyncGenerator<AartsPayload, FlightItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Flight Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Flight` }] }
            return flight
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateDelete(flight: FlightItem, identity: IIdentity): AsyncGenerator<AartsPayload, FlightItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Delete Flight Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly deleted Flight` }] }
            return flight
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbQueryInput, undefined> {
        return args
    }
    /**
     * Validating the get parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbGetInput, undefined> {
        return args
    }
}