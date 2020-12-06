export const GenerateTouristsReservationsCommand = 
`import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { GenerateTouristsReservationsItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { names } from "./random-names/names"

export class GenerateTouristsReservationsCommand extends BaseDynamoItemManager<GenerateTouristsReservationsItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: GenerateTouristsReservationsItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, GenerateTouristsReservationsItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start GenerateTouristsReservations Failed'
            throw new Error(\`\${errors.join(";;")}\`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: GenerateTouristsReservationsItem, identity: IIdentity, ringToken: string) : Promise<GenerateTouristsReservationsItem> { 
        for (let i = 0; i < Number(proc.touristsToCreate || 10); i++) {

            const namesLenght = proc.useNamesLength || names.length
            const fname = proc.fname ?
                proc.fname :
                names[~~(Math.random() * namesLenght)]
            const lname = proc.lname ?
                proc.lname :
                names[~~(Math.random() * namesLenght)]
            let generatedIban = 0
            for (const ch of \`\${fname}\${lname}\`) {
                generatedIban += ch.charCodeAt(0)
            }
            const touristToCreate = {
                // some random id card adn iban. NOTE still possible for large nr of tourists to generate same id_card, 
                // in this case second insert will be error as id_card is set to be unique
                iban: proc.iban ? \`\${proc.iban}\` : \`BGSOF\${generatedIban}\`,
                id_card: (~~(Math.random() * 1000000) + ~~(Math.random() * 1000000) + ~~(Math.random() * 1000000)),
                fname,
                lname,
                item_state: "reservation",
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
`