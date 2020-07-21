import { BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"

// using the one from the aarts-dynamodb/__specs__
import {_specs_AirplaneItem as AirplaneItem} from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"

// Although we are reusing dynamoitem definition from the __specs__ we are redefining the manager for that object here
export class AirplaneManager extends BaseDynamoItemManager<AirplaneItem> {
    async *validateCreate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
        console.log("111 DEBUG is " + process.env.DEBUG);
        console.log("DB_NAME is " + process.env.DB_NAME);
        process.env.DEBUG && (yield `[airplaneManager/validateCreate]: BEGIN validateCreate method`)
            // example domain validations
            const errors: string[] = []

            if (airplane && airplane.number_of_seats === 4) {
                errors.push("number_of_seats: number_of_seats cannot be 4")
                yield "number_of_seats: number_of_seats cannot be 4"
            }
            if (airplane && airplane.number_of_seats && airplane.number_of_seats <= 10) {
                errors.push("number_of_seats: number_of_seats cannot be less or equal 10")
                yield "number_of_seats: number_of_seats cannot be less or equal 10"
            }
            if (airplane && airplane.number_of_seats && airplane.number_of_seats > 100) {
                errors.push("number_of_seats: number_of_seats cannot be greater than 100")
                yield "number_of_seats: number_of_seats cannot be greater than 100"
            }

            if (errors.length > 0) {
                yield `[airplaneManager/validateCreate]: END WITH ERRORS ${ppjson(errors)}`
                console.log('INVALID airplane: ', errors)
                throw new Error(errors.join(";;"))
            } else {
                yield `[airplaneManager/validateCreate]: END successful`
                console.log('valid airplane', airplane)
                return airplane
            }
    }

    async *validateUpdate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
            process.env.DEBUG && (yield "AirplaneItem validator validating " + ppjson(airplane))
            return airplane
    }

}