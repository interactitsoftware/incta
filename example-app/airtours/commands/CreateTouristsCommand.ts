import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { AirplaneItem, AirportItem, CountryItem, CreateTouristsItem, FlightItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { getItemsByRefkeyValue, DynamoItem } from "aarts-dynamodb"


export class CreateTouristsCommand extends BaseDynamoItemManager<CreateTouristsItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: CreateTouristsItem, identity: IIdentity): AsyncGenerator<string, CreateTouristsItem, undefined> {
        proc.arguments.start_date = new Date().toISOString()

        const errors: string[] = []

        // here you can apply further domain logic on permissions, authorizations etc
        
        if (errors.length > 0) {
            yield `Start CreateTourists Failed`
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: CreateTouristsItem) : Promise<CreateTouristsItem> { 

        for (let i = 0; i < Number(args.payload.arguments.touristsToCreate || 10); i++) {
            const flightsFound = await getItemsByRefkeyValue<FlightItem>(FlightItem.__type, "flight_code", args.payload.arguments.flightCode as string)
            const airplaneFound = await getItemsByRefkeyValue<AirplaneItem>(AirplaneItem.__type, "name", args.payload.arguments.airplaneCode as string)
            const fromAirportsFound = await getItemsByRefkeyValue<AirportItem>(AirportItem.__type, "name", args.payload.arguments.fromAirportName as string)
            const toAirportsFound = await getItemsByRefkeyValue<AirportItem>(AirportItem.__type, "name", args.payload.arguments.toAirportName as string)
            const fromCountriesFound = await getItemsByRefkeyValue<CountryItem>(CountryItem.__type, "name", args.payload.arguments.fromCountryName as string)
            const toCountriesFound = await getItemsByRefkeyValue<CountryItem>(CountryItem.__type, "name", args.payload.arguments.toCountryName as string)

            const touristToCreate = {
                iban: args.payload.arguments.iban ? `${args.payload.arguments.iban}${i}` : undefined,
                fname: `${args.payload.arguments.fname}${i}`,
                lname: `${args.payload.arguments.lname}${i}`,
                flight: !!flightsFound && flightsFound.length > 0 ? (flightsFound[0] as DynamoItem).id : undefined,
                airplane: !!airplaneFound && airplaneFound.length > 0 ? (airplaneFound[0] as DynamoItem).id : undefined,
                from_airport: !!fromAirportsFound && fromAirportsFound.length > 0 ? (fromAirportsFound[0] as DynamoItem).id : undefined,
                to_airport: !!toAirportsFound && toAirportsFound.length > 0 ? (toAirportsFound[0] as DynamoItem).id : undefined,
                from_country: !!fromCountriesFound && fromCountriesFound.length > 0 ? (fromCountriesFound[0] as DynamoItem).id : undefined,
                to_country: !!toCountriesFound && toCountriesFound.length > 0 ? (toCountriesFound[0] as DynamoItem).id : undefined,
            }

            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": touristToCreate,
                "identity": {
                    "username": "akrsmv"
                }
            })
        }

        return args.payload.arguments as CreateTouristsItem
    }
}
