import { TestModel_Nomenclature } from "./Nomenclature"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { TestModel_AirportItem, TestModel_AirplaneItem } from "./_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"

export class TestModel_AirplaneModel extends TestModel_Nomenclature { 
    public manifacturer:string = "unknown"
}

export class TestModel_AirplaneManifacturer extends TestModel_Nomenclature { 
    public country: string = "unknown"
}

export class TestModel_Airplane {
    
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }

    //--ref keys
    public reg_uq_str?: string
    public reg_uq_number?: number
    public model?: string
    public manifacturer?: string
    //--rest of keys
    public number_of_seats?: number
}

export class TestModel_AirplaneManager extends BaseDynamoItemManager<TestModel_AirplaneItem> {
    async *validateCreate(samolet: TestModel_AirplaneItem, identity: IIdentity): AsyncGenerator<string, TestModel_AirplaneItem, undefined> {
        yield `[SamoletManager/validateCreate]: BEGIN validateCreate method`
            // TODO validate this samolet
            const errors: string[] = []

            if (samolet.wing_length === 4) {
                errors.push("wing_length: wing_length cannot be 4")
                yield "wing_length: wing_length cannot be 4"
            }
            if (samolet.wing_length <= 10) {
                errors.push("wing_length: wing_length cannot be less or equal 10")
                yield "wing_length: wing_length cannot be less or equal 10"
            }
            if (samolet.wing_length > 100) {
                errors.push("wing_length: wing_length cannot be greater than 100")
                yield "wing_length: wing_length cannot be greater than 100"
            }

            if (errors.length > 0) {
                yield `[SamoletManager/validateCreate]: END WITH ERRORS validateCreate method`
                console.log('INVALID samolet: ', errors)
                throw new Error(errors.join(";;"))
            } else {
                yield `[SamoletManager/validateCreate]: END successful validateCreate method`
                return samolet
            }
    }

    async *validateUpdate(samolet: TestModel_AirplaneItem, identity: IIdentity): AsyncGenerator<string, TestModel_AirplaneItem, undefined> {
            yield "SO THIS IS THE DOMAIN VALIDATE UPDATE METHOD"
            return samolet
    }
}