import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-ddb/interfaces"
import { FlightItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class FlightDomain extends BaseDynamoItemManager<FlightItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(flight: FlightItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, FlightItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(flight: FlightItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, FlightItem, undefined> {
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
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(flight: FlightItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, FlightItem, undefined> {
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
