import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { loginfo, ppjson } from "aarts-utils"

// using the one from the aarts-dynamodb/__specs__
import {_specs_AirplaneItem as AirplaneItem} from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"

// Although we are reusing dynamoitem definition from the __specs__ we are redefining the manager for that object here
export class AirplaneManager extends BaseDynamoItemManager<AirplaneItem> {
    async *validateCreate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirplaneItem, undefined> {

        !process.env.DEBUGGER || loginfo(`[airplaneManager/validateCreate]: BEGIN validateCreate method`)
            // example domain validations
            const errors: string[] = []

            if (airplane && airplane.number_of_seats === 4) {
                errors.push("number_of_seats: number_of_seats cannot be 4")
                yield { resultItems: [{ message:  "number_of_seats: number_of_seats cannot be 4"}]}
            }
            if (airplane && airplane.number_of_seats && airplane.number_of_seats <= 10) {
                errors.push("number_of_seats: number_of_seats cannot be less or equal 10")
                yield { resultItems: [{ message:  "number_of_seats: number_of_seats cannot be less or equal 10"}]}
            }
            if (airplane && airplane.number_of_seats && airplane.number_of_seats > 100) {
                errors.push("number_of_seats: number_of_seats cannot be greater than 100")
                yield { resultItems: [{ message:  "number_of_seats: number_of_seats cannot be greater than 100"}]}
            }

            if (errors.length > 0) {
                yield { resultItems: [{ message:  `[airplaneManager/validateCreate]: END WITH ERRORS ${ppjson(errors)}`}]}
                console.log('INVALID airplane: ', errors)
                throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
            } else {
                !process.env.DEBUGGER || loginfo(`[airplaneManager/validateCreate]: END successful`)
                console.log('valid airplane', airplane)
                return airplane
            }
    }

    async *validateUpdate(airplane: AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirplaneItem, undefined> {
            !process.env.DEBUGGER || loginfo("AirplaneItem validator validating ", airplane)
            return airplane
    }

}