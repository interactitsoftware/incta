import { BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { Nomenclature } from "./Nomenclature"
import { AirplaneItem } from "./_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"

export class AirplaneModel extends Nomenclature { }
export class AirplaneManifacturer extends Nomenclature { }

export class Airplane {
    //-- static meta keys
    public static __type: string
    public static __refkeys: string[]
    //--ref keys
    public home_airport: string = ""
    public country: string = ""
    public model: string = ""
    public manifacturer: string = ""
    //--rest of keys
    public number_of_seats: number = 0
}


export class AirplaneManager extends BaseDynamoItemManager<AirplaneItem> {
    async *validateCreate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
        process.env.DEBUG || (yield `[airplaneManager/validateCreate]: BEGIN validateCreate method`)
            // example domain validations
            const errors: string[] = []

            if (airplane.number_of_seats === 4) {
                errors.push("number_of_seats: number_of_seats cannot be 4")
                yield "number_of_seats: number_of_seats cannot be 4"
            }
            if (airplane.number_of_seats <= 10) {
                errors.push("number_of_seats: number_of_seats cannot be less or equal 10")
                yield "number_of_seats: number_of_seats cannot be less or equal 10"
            }
            if (airplane.number_of_seats > 100) {
                errors.push("number_of_seats: number_of_seats cannot be greater than 100")
                yield "number_of_seats: number_of_seats cannot be greater than 100"
            }

            if (errors.length > 0) {
                yield `[airplaneManager/validateCreate]: END WITH ERRORS`
                console.log('INVALID airplane: ', errors)
                throw new Error(errors.join(";;"))
            } else {
                yield `[airplaneManager/validateCreate]: END successful`
                console.log('valid airplane', airplane)
                return airplane
            }
    }

    async *validateUpdate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
            process.env.DEBUG || (yield "AirplaneItem validator validating " + ppjson(airplane))
            return airplane
    }

}