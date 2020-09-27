import { BaseDynamoItemManager, DynamoItem } from "../../BaseItemManager"
import { _specs_AirportItem } from "./_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { AttributeMap, StreamRecord } from "aws-sdk/clients/dynamodbstreams"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { fromAttributeMap, versionString } from "../../DynamoDbClient"
import { MixinConstructor } from "aarts-types/Mixin"

export class _specs_Airport {
    
    constructor(...args: any[]) {
        // client domain items left with a requirement to have a rest constructor,
        // however below code is executed already on a DynamoItem level,
        // and having it here again will cause a nested object with same props
        
        // Object.assign(this, args.reduce((accum, arg)=>{
        //     Object.keys(arg).forEach(k => {
        //         accum[k] = arg[k]
        //     })
        //     return accum
        // },{}))
    }

    public airport_size: number = 11
    public country?: string
    public branch?: string
    public type?: string
    public name?: string
    public code?: string
}

export class _specs_AirportManager extends BaseDynamoItemManager<_specs_AirportItem> {
    async *validateCreate(airport: _specs_AirportItem, identity: IIdentity): AsyncGenerator<string, _specs_AirportItem, undefined> {
            const errors: string[] = []

            if (airport.airport_size === 100) {
                errors.push("airport_size: nah 100 is taken")
                yield "airport_size: nah 100 is taken"
            }
            if (airport.airport_size <= 10) {
                errors.push("airport_size: cannot be le than 10")
                yield "airport_size: cannot be le than 10"
            }
            if (airport.airport_size > 1000) {
                errors.push("size: cannot be greater than 1000")
                yield "size: cannot be greater than 1000"
            }

            if (errors.length > 0) {
                console.log('INVALID airport: ', errors)
                throw new Error(`${process.env.ringToken}: ${errors.join("; ")}`)
            } else {
                return airport
            }
    }

    async *validateUpdate(airport: _specs_AirportItem, identity: IIdentity): AsyncGenerator<string, _specs_AirportItem, undefined> {
        throw new Error(`${process.env.ringToken}: Method not implemented.`)
    }
}