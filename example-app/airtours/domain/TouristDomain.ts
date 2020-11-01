import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-dynamodb/interfaces"
import { AirplaneItem, AirportItem, CountryItem, FlightItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"
import { setDomainRefkeyFromPayload } from "aarts-dynamodb/_itemUtils"
import { names } from "../commands/random-names/names"

export class TouristDomain extends BaseDynamoItemManager<TouristItem> {
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateCreate(tourist: TouristItem, identity: IIdentity): AsyncGenerator<AartsPayload, TouristItem, undefined> {
        const errors: string[] = []

        // domain logic for tourist creation
        await setDomainRefkeyFromPayload(CountryItem.__type, tourist, 'to_country', 'name', errors)
        await setDomainRefkeyFromPayload(CountryItem.__type, tourist, 'from_country', 'name', errors)
        await setDomainRefkeyFromPayload(AirportItem.__type, tourist, 'to_airport', 'name', errors)
        await setDomainRefkeyFromPayload(AirportItem.__type, tourist, 'from_airport', 'name', errors)
        await setDomainRefkeyFromPayload(FlightItem.__type, tourist,  'flight', 'flight_code', errors)
        await setDomainRefkeyFromPayload(AirplaneItem.__type, tourist, 'airplane', 'reg_uq_str', errors)
        
        // -- test simulating errored commands
        if (tourist.fname === names[0]) {
            yield { resultItems: [{ message: "Sorry tourists with that name already exists [just simulating error here]" }, errors] }
            throw new Error("Sorry tourists with that name already exists [just simulating error here]")
        }
        // -- end test

        if (tourist.strictDomainMode) {
            // do not tolerate missing pieces
            // examine payload for missing fields or directly examine the errors array and throw error
            if (errors.length > 0) {
                yield { resultItems: [{ message: `Create Tourist Failed` }, errors] }
                throw new Error(`${errors.join(";;")}`)
            }
        } else {
            // record item, and if missing peaces record corrsp messages
            tourist.processingMessages = []
            if (!tourist.to_country) {
                tourist.processingMessages.push({ message: "Invalid destination country", severity: "error", properties: "to_country" })
            }
            if (!tourist.from_country) {
                tourist.processingMessages.push({ message: "Invalid origin country", severity: "error", properties: "from_country" })
            }
            if (!tourist.to_airport) {
                tourist.processingMessages.push({ message: "Invalid destination airport", severity: "error", properties: "to_airport" })
            }
            if (!tourist.from_airport) {
                tourist.processingMessages.push({ message: "Invalid origin airport", severity: "error", properties: "from_airport" })
            }
            if (!tourist.flight) {
                tourist.processingMessages.push({ message: "Invalid flight", severity: "error", properties: "flight" })
            }
            if (!tourist.airplane) {
                tourist.processingMessages.push({ message: "Invalid airplane", severity: "warning", properties: "airplane" })
            }
        }

        yield { resultItems: [{ message: `Successfuly created Tourist` }] }
        return tourist

    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateUpdate(tourist: TouristItem, identity: IIdentity): AsyncGenerator<AartsPayload, TouristItem, undefined> {
        const errors: string[] = []

        // domain logic for tourist update


        if (errors.length > 0) {
            yield { resultItems: [{ message: `Update Tourist Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly updated Tourist` }] }
            return tourist
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Yielded objects should be of the form:
     * yield { resultItems: [{ message: `message here` }] }
     */
    async *validateDelete(tourist: TouristItem, identity: IIdentity): AsyncGenerator<AartsPayload, TouristItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Delete Tourist Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield { resultItems: [{ message: `Successfuly deleted Tourist` }] }
            return tourist
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
