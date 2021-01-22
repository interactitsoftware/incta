import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { GenerateTouristsReservationsItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { names } from "./random-names/names"
import { Tourist } from "../__bootstrap/items/Tourist"
import { uuid } from "aarts-utils"
import { DynamoItem } from "aarts-ddb"
/* USE THAT FOR TESTING
{
  "action": "start",
  "item": "GenerateTouristsReservations",
  "arguments": {
      "simulateErrors":false,
      "noUniqueIdCardFields": true,
      "noUniqueIbanFields": true,
      "useNamesLength": 3,
    "touristsToCreate": 50,
    "toAirport": ["Sofia airport","Bourgas airport","Belgrade airport","Beijing airport","Kenedi airport","London airport","Sydney airport","Moscow airport","St. Petersburg airport","Novgorod airport"],
    "fromAirport": ["Sofia airport","Bourgas airport","Belgrade airport","Beijing airport","Kenedi airport","London airport","Sydney airport","Moscow airport","St. Petersburg airport","Novgorod airport"],
    "toCountry": ["Bulgaria",
"Serbia",
"Russia",
"China",
"United States",
"United Kingdom",
"Australia"],
    "fromCountry": ["Bulgaria",
"Serbia",
"Russia",
"China",
"United States",
"United Kingdom",
"Australia"],
    "airplane": ["reg111",
"reg222",
"reg333",
"reg444",
"reg555"],
    "flight": ["F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20"]
  },
  "identity": {
    "username": "testuser"
  }
}
*/
export class GenerateTouristsReservationsCommand extends BaseDynamoItemManager<GenerateTouristsReservationsItem> {

    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: GenerateTouristsReservationsItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, GenerateTouristsReservationsItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start GenerateTouristsReservations Failed'
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: GenerateTouristsReservationsItem, identity: IIdentity, ringToken: string): Promise<GenerateTouristsReservationsItem> {
        const namesArr = proc.simulateErrors? names : names.slice(1)
        for (let i = 0; i < Number(proc.touristsToCreate || 10); i++) {

            const namesLenght = proc.useNamesLength || namesArr.length
            const fname = proc.fname ?
                Array.isArray(proc.fname) ? proc.fname[~~(Math.random() * proc.fname.length)] : proc.fname :
                namesArr[~~(Math.random() * namesLenght)]
            const lname = proc.lname ?
                Array.isArray(proc.lname) ? proc.lname[~~(Math.random() * proc.lname.length)] : proc.lname :
                namesArr[~~(Math.random() * namesLenght)]
            let generatedIban = 0
            for (const ch of `${fname}${lname}`) {
                generatedIban += ch.charCodeAt(0)
            }
            const touristToCreate: Tourist & {item_state: string, strictDomainMode?: boolean } = {
                // some random id card adn iban. NOTE still possible for large nr of tourists to generate same id_card, 
                // in this case second insert will be error as id_card is set to be unique
                iban: proc.noUniqueIbanFields ? undefined : (proc.iban ? `${proc.iban}` : `BGSOF${generatedIban}`) + `#${uuid()}`,//ensure uniqueness,
                id_card: proc.noUniqueIdCardFields ? undefined : (~~(Math.random() * 100000000000000000000)) + (~~(Math.random() * 10)) + (~~(Math.random() * 100)) + (~~(Math.random() * 1000)) + (~~(Math.random() * 10000)) + (~~(Math.random() * 100000)),
                fname,
                lname,
                item_state: "reservation",
                flight: Array.isArray(proc.flight) ? proc.flight[~~(Math.random() * proc.flight.length)] : proc.flight,
                airplane: Array.isArray(proc.airplane) ? proc.airplane[~~(Math.random() * proc.airplane.length)] : proc.airplane,
                from_airport: Array.isArray(proc.fromAirport) ? proc.fromAirport[~~(Math.random() * proc.fromAirport.length)] : proc.fromAirport,
                to_airport: Array.isArray(proc.toAirport) ? proc.toAirport[~~(Math.random() * proc.toAirport.length)] : proc.toAirport,
                from_country: Array.isArray(proc.fromCountry) ? proc.fromCountry[~~(Math.random() * proc.fromCountry.length)] : proc.fromCountry,
                to_country: Array.isArray(proc.toCountry) ? proc.toCountry[~~(Math.random() * proc.toCountry.length)] : proc.toCountry,
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
    public onCreate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onCreate logic in here or delete this method*/
        // console.log("ON CREATE TRIGGERED for " + __type)
    }
    public onUpdate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onUpdate logic in here or delete this method*/
        // console.log("ON UPDATE TRIGGERED for " + __type)
    }
    public onSuccess = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onSuccess logic in here or delete this method*/
        // console.log("ON SUCCESS TRIGGERED for " + __type)
    }
    public onError = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onError logic in here or delete this method*/
        // console.log("ON ERROR TRIGGERED for " + __type)
    }
}