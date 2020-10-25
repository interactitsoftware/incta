import { BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class AirplaneDomain extends BaseDynamoItemManager<AirplaneItem> {
    async *validateCreate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirplaneItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Airplane Failed  ${ppjson(errors)}` }] }
            throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Airplane` }] }
            return airplane
        }
    }
    async *validateUpdate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirplaneItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Airplane Failed  ${ppjson(errors)}` }] }
            throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Airplane` }] }
            return airplane
        }
    }
    async *validateDelete(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirplaneItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Airplane Failed  ${ppjson(errors)}` }] }
            throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Airplane` }] }
            return airplane
        }
    }
    /**
     * Placeholder for validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbQueryInput, undefined> {
        return args
    }
    /**
     * Placeholder for validating the get parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbGetInput, undefined> {
        return args
    }
}
