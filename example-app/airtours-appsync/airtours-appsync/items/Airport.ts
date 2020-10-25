import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { AartsPayload, IIdentity } from "aarts-types/interfaces";

// using the one from the aarts-dynamodb/__specs__
import {_specs_AirportItem as AirportItem} from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
import { loginfo } from "aarts-utils"

// Although we are reusing dynamoitem definition from the __specs__ we are redefining the manager for that object here
export class AirportManager extends BaseDynamoItemManager<AirportItem> {
    async *validateCreate(airport: AirportItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirportItem, undefined> {
            const errors: string[] = []

            if (airport.airport_size === 100) {
                errors.push("airport_size: nah 100 is taken")
                yield { resultItems: [{ message:  "airport_size: nah 100 is taken"}]}
            }
            if (airport.airport_size <= 10) {
                errors.push("airport_size: cannot be le than 10")
                yield { resultItems: [{ message:   "airport_size: cannot be le than 10"}]}
            }
            if (airport.airport_size > 1000) {
                errors.push("size: cannot be greater than 1000")
                yield { resultItems: [{ message: "size: cannot be greater than 1000"}]}
            }

            if (errors.length > 0) {
                console.log('INVALID airport: ', errors)
                throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
            } else {
                yield { resultItems: [{ message: "Voila! A valid airport!"}]}
                loginfo('valid airport','aaAA', airport, {tralala: "123"}, 5, [1,2,3,'create something'])
                return airport
            }
    }

    async *validateUpdate(airport: AirportItem, identity: IIdentity): AsyncGenerator<AartsPayload, AirportItem, undefined> {
        return airport
    }

    // public onCreate = async (__type: string, newImage: DynamoItem) => {
    //     console.log("^^^^^^^^^^^FROM A SPECIFIC ITEM MANAGER BECAUSE HE IMPLEMENTED onCreate " + + "__type: " + __type + ppjson(newImage));
    //     await transactUpdateItem(
    //         newImage,
    //         {
    //             tralalalalalla: 100,
    //             id: newImage.id,
    //             revisions: newImage.revisions,
    //             meta: `${versionString(0)}|${newImage.id.substr(0, newImage.id.indexOf("|"))}`
    //         },
    //         (this.lookupItems.get(newImage.__typename) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
    // }
}