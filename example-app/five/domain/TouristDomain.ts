import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { DdbGetInput, DdbQueryInput } from "aarts-ddb/interfaces"
import { AirplaneItem, AirportItem, CountryItem, FlightItem, TouristItem, TouristSeasonItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { loginfo, ppjson, uuid } from "aarts-utils"
import { setDomainRefkeyFromPayload, DynamoItem } from "aarts-ddb"
import { names } from "../commands/random-names/names"
import { TouristSeason } from "../__bootstrap/items/TouristSeason"

/*
TEST EVENT
{
    "action": "create",
    "item": "Tourist",
    "arguments": {
        "id":"Tourist|1",
        "meta": "v_0|Tourist|1",
        "fname": "a",
        "lname": "b",
        "iban": "1",
        "tourist_season": "2021/Q1",
        "airplane": "reg111",
        "flight": "F8",
        "from_airport": "Airport|SofiaId",
        "to_airport": "Airport|BelgradeId#v_0|Airport|BelgradeId",
        "from_country": "Country|BulgariaId",
        "to_country": "Serbia"
    },
    "identity": {
        "username": "testuser"
    }
}
*/
export class TouristDomain extends BaseDynamoItemManager<TouristItem> {
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateCreate(tourist: TouristItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristItem, undefined> {
        const errors: string[] = []
        // domain logic for tourist creation
        await setDomainRefkeyFromPayload(CountryItem.__type, tourist, 'to_country', 'name', ringToken, errors)
        await setDomainRefkeyFromPayload(CountryItem.__type, tourist, 'from_country', 'name', ringToken, errors)
        await setDomainRefkeyFromPayload(AirportItem.__type, tourist, 'to_airport', 'name', ringToken, errors)
        await setDomainRefkeyFromPayload(AirportItem.__type, tourist, 'from_airport', 'name', ringToken, errors)
        await setDomainRefkeyFromPayload(FlightItem.__type, tourist,  'flight', 'flight_code', ringToken, errors)
        await setDomainRefkeyFromPayload(AirplaneItem.__type, tourist, 'airplane', 'reg_uq_str', ringToken, errors)
        await setDomainRefkeyFromPayload(TouristSeasonItem.__type, tourist, 'tourist_season', 'code', ringToken, errors)

        !process.env.DEBUGGER || loginfo({ ringToken }, 'errors array is ', ppjson(errors))

        // -- test simulating errored commands
        if (tourist.fname === names[0]) {
            if (~~(Math.random()*3) === 0){
                tourist.fname = names[0] + ', BUT ITS OKAY' // try simulate events that pass after one-two retries 
            } else {
                yield "Sorry tourists with that name already exists [just simulating error here]"
                throw new Error("Sorry tourists with that name already exists [just simulating error here]")
            }
        }
        // -- end test

        if (tourist.strictDomainMode) {
            // do not tolerate missing pieces
            // examine payload for missing fields or directly examine the errors array and throw error
            if (errors.length > 0) {
                yield `Create Tourist Failed`
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
            if (!tourist.tourist_season) {
                tourist.processingMessages.push({ message: "Invalid tourist season", severity: "warning", properties: "tourist_season" })
            }
        }
        // ensure notifying clients will not happen when mass generation/batch processing calls were done (we do not pass this prop from commands)
        if (tourist.strictDomainMode) {
            yield `Successfuly created Tourist`
        }
        return tourist
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateUpdate(tourist: TouristItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Update Tourist Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly updated Tourist`
            return tourist
        }
    }
    /**
     * Validating the query parameters and user identity.
     * Each yielded string will be sent via AppSync as push notification
     */
    async *validateDelete(tourist: TouristItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TouristItem, undefined> {
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Delete Tourist Failed`
            throw new Error(`${errors.join(";;")}`)
        } else {
            yield `Successfuly deleted Tourist`
            return tourist
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

    public onCreate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onCreate logic in here or delete this method*/
        // console.log("ON CREATE TRIGGERED for " + __type)
    }
    public onUpdate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onUpdate logic in here or delete this method*/
        // console.log("ON UPDATE TRIGGERED for " + __type)
    }
}