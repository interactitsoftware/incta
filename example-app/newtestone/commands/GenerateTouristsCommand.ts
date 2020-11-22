
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { GenerateTouristsItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { names } from "./random-names/names"

export class GenerateTouristsCommand extends BaseDynamoItemManager<GenerateTouristsItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: GenerateTouristsItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, GenerateTouristsItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start CreateTourists Failed'
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: GenerateTouristsItem, identity: IIdentity, ringToken: string) : Promise<GenerateTouristsItem> { 
        for (let i = 0; i < Number(proc.touristsToCreate || 10); i++) {

            const namesLenght = proc.useNamesLength || names.length
            const fname = proc.fname ?
                proc.fname :
                names[~~(Math.random() * namesLenght)]
            const lname = proc.lname ?
                proc.lname :
                names[~~(Math.random() * namesLenght)]
            let generatedIban = 0
            for (const ch of `${fname}${lname}`) {
                generatedIban += ch.charCodeAt(0)
            }
            const touristToCreate = {
                // some random id card adn iban. NOTE still possible for large nr of tourists to generate same id_card, 
                // in this case second insert will be error as id_card is set to be unique
                iban: proc.iban ? `${proc.iban}` : `BGSOF${generatedIban}`,
                id_card: (~~(Math.random() * 1000000) + ~~(Math.random() * 1000000) + ~~(Math.random() * 1000000)),
                fname,
                lname,
                flight: proc.flight,
                airplane: proc.airplane,
                from_airport: proc.fromAirport,
                to_airport: proc.toAirport,
                from_country: proc.fromCountry,
                to_country: proc.toCountry,
                strictDomainMode: proc.strictDomainMode
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

        return proc
    }
}
