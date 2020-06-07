import { BaseDynamoItemManager } from "../../BaseItemManager"
import { TestModel_AirportItem } from "./_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"

export class TestModel_Airport {
    
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }

    public airport_size: number = 100
    public country?: string
    public name?: string
}

export class TestModel_AirportManager extends BaseDynamoItemManager<TestModel_AirportItem> {
    async *validateCreate(airport: TestModel_AirportItem, identity: IIdentity): AsyncGenerator<string, TestModel_AirportItem, undefined> {
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
                throw new Error(errors.join("; "))
            } else {
                return airport
            }
    }

    async *validateUpdate(airport: TestModel_AirportItem, identity: IIdentity): AsyncGenerator<string, TestModel_AirportItem, undefined> {
        throw new Error("Method not implemented.")
    }
}