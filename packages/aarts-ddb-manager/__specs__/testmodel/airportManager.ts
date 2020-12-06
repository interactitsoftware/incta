import { IIdentity } from "aarts-types"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { AirportItem } from "./_DynamoItems"

export class _specs_AirportManager extends BaseDynamoItemManager<AirportItem> {
    async *validateCreate(airport: AirportItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirportItem, undefined> {
            const errors: string[] = []

            if (airport.airport_size === 100) {
                errors.push("airport_size: nah 100 is taken")
                yield "airport_size: nah 100 is taken"
            }
            if (airport.airport_size <= 10) {
                errors.push("airport_size: cannot be le than 10")
                yield "airport_size: cannot be le than 10"
            }
            if (airport.airport_size > 1000) {
                errors.push("size: cannot be greater than 1000")
                yield "size: cannot be greater than 1000"
            }

            if (errors.length > 0) {
                console.log('INVALID airport: ', errors)
                throw new Error(`${ringToken}: ${errors.join("; ")}`)
            } else {
                return airport
            }
    }

    async *validateUpdate(airport: AirportItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirportItem, undefined> {
        throw new Error(`${ringToken}: Method not implemented.`)
    }
}