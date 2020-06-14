import { _specs_Nomenclature } from "./Nomenclature"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { _specs_AirportItem, _specs_AirplaneItem } from "./_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-types/utils"

export class _specs_AirplaneModel extends _specs_Nomenclature { 
    public manifacturer:string = "unknown"
}

export class _specs_AirplaneManifacturer extends _specs_Nomenclature { 
    public country: string = "unknown"
}

export class _specs_Airplane {
    
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

    //--ref keys
    public reg_uq_str?: string
    public reg_uq_number?: number
    public model?: string
    public manifacturer?: string
    //--rest of keys
    public number_of_seats?: number
}

export class _specs_AirplaneManager extends BaseDynamoItemManager<_specs_AirplaneItem> {
    async *validateCreate(samolet: _specs_AirplaneItem, identity: IIdentity): AsyncGenerator<string, _specs_AirplaneItem, undefined> {
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
                yield `[SamoletManager/validateCreate]: END WITH ERRORS  ${ppjson(errors)}`
                console.log('INVALID samolet: ', errors)
                throw new Error(errors.join(";;"))
            } else {
                yield `[SamoletManager/validateCreate]: END successful validateCreate method`
                return samolet
            }
    }

    async *validateUpdate(samolet: _specs_AirplaneItem, identity: IIdentity): AsyncGenerator<string, _specs_AirplaneItem, undefined> {
            yield "SO THIS IS THE DOMAIN VALIDATE UPDATE METHOD"
            return samolet
    }
}