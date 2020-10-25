import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirportItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirportDomain extends BaseDynamoItemManager<AirportItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateCreate(airport: AirportItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirportItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Airport Failed  ${ppjson(errors)}` }] }
            throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Airport` }] }
            return airport
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateUpdate(airport: AirportItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirportItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Airport Failed  ${ppjson(errors)}` }] }
            throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Airport` }] }
            return airport
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateDelete(airport: AirportItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirportItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Airport Failed  ${ppjson(errors)}` }] }
            throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Airport` }] }
            return airport
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
