import { IIdentity } from "aarts-types"
import { ppjson } from "aarts-utils"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { AirplaneItem } from "./_DynamoItems"

export class _specs_AirplaneManager extends BaseDynamoItemManager<AirplaneItem> {
    async *validateCreate(samolet: AirplaneItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, AirplaneItem, undefined> {
        yield `[SamoletManager/validateCreate]: BEGIN validateCreate method`
            // TODO validate this samolet
            const errors: string[] = []

            if (samolet.number_of_seats  && samolet.number_of_seats < 10) {
                errors.push("wing_length: number_of_seats cannot be less than 10")
                yield "wing_length: number_of_seats cannot be less than 10"
            }
            if (samolet.number_of_seats  && samolet.number_of_seats > 1000) {
                errors.push("wing_length: wing_length cannot be greater than 1000")
                yield "wing_length: wing_length cannot be greater than 1000"
            }

            if (errors.length > 0) {
                yield `[SamoletManager/validateCreate]: END WITH ERRORS  ${ppjson(errors)}`
                console.log('INVALID samolet: ', errors)
                throw new Error(`${ringToken}: ${errors.join(";;")}`)
            } else {
                yield `[SamoletManager/validateCreate]: END successful validateCreate method`
                return samolet
            }
    }

    async *validateUpdate(samolet: AirplaneItem, identity: IIdentity): AsyncGenerator<string, AirplaneItem, undefined> {
        yield "SO THIS IS THE DOMAIN VALIDATE UPDATE METHOD"
            return samolet
    }
}