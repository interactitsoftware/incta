import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { CreateTouristsProperlyItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { names } from "./random-names/names"
import { CreateTouristsProperly } from "../__bootstrap/items/CreateTouristsProperly"


export class CreateTouristsProperlyCommand extends BaseDynamoItemManager<CreateTouristsProperlyItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: AartsPayload<CreateTouristsProperlyItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Start CreateTouristsProperly Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<CreateTouristsProperlyItem> { 
        // TODO make commands input accepting TCommandPayload and identity
        var payload = args.payload.arguments as CreateTouristsProperly
        for (let i = 0; i < Number(args.payload.arguments.touristsToCreate || 10); i++) {

            const namesLenght = args.payload.arguments.useNamesLength || names.length
            const fname = args.payload.arguments.fname ?
                args.payload.arguments.fname :
                names[~~(Math.random() * namesLenght)]
            const lname = args.payload.arguments.lname ?
                args.payload.arguments.lname :
                names[~~(Math.random() * namesLenght)]
            let generatedIban = 0
            for (const ch of `${fname}${lname}`) {
                generatedIban += ch.charCodeAt(0)
            }
            const touristToCreate = {
                // some random id card adn iban. NOTE still possible for large nr of tourists to generate same id_card, 
                // in this case second insert will be error as id_card is set to be unique
                iban: args.payload.arguments.iban ? `${args.payload.arguments.iban}` : `BGSOF${generatedIban}`,
                id_card: (~~(Math.random() * 1000000) + ~~(Math.random() * 1000000) + ~~(Math.random() * 1000000)),
                fname,
                lname,
                flight: payload.flight,
                airplane: payload.airplane,
                from_airport: payload.fromAirport,
                to_airport: payload.toAirport,
                from_country: payload.fromCountry,
                to_country: payload.toCountry,
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

        return args.payload.arguments as CreateTouristsProperlyItem
    }
}
