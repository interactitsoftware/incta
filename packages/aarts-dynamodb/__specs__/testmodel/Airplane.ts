import { BaseDynamoItemManager } from "../../BaseItemManager"
import { _specs_AirportItem, _specs_AirplaneItem } from "./_DynamoItems"
import { AartsPayload, IIdentity } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils/utils"

export class _specs_AirplaneModel { 
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
    public manifacturer:string = "unknown"
    public country?:string
    public name?:string
}

export class _specs_AirplaneManifacturer { 
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
    public country?:string
    public name?:string
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
    async *validateCreate(samolet: _specs_AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, _specs_AirplaneItem, undefined> {
        yield { resultItems: [{ message:  `[SamoletManager/validateCreate]: BEGIN validateCreate method`}]}
            // TODO validate this samolet
            const errors: string[] = []

            if (samolet.number_of_seats  && samolet.number_of_seats < 10) {
                errors.push("wing_length: number_of_seats cannot be less than 10")
                yield { resultItems: [{ message:  "wing_length: number_of_seats cannot be less than 10"}]}
            }
            if (samolet.number_of_seats  && samolet.number_of_seats > 1000) {
                errors.push("wing_length: wing_length cannot be greater than 1000")
                yield { resultItems: [{ message:  "wing_length: wing_length cannot be greater than 1000"}]}
            }

            if (errors.length > 0) {
                yield { resultItems: [{ message:  `[SamoletManager/validateCreate]: END WITH ERRORS  ${ppjson(errors)}`}]}
                console.log('INVALID samolet: ', errors)
                throw new Error(`${process.env.ringToken}: ${errors.join(";;")}`)
            } else {
                yield { resultItems: [{ message:  `[SamoletManager/validateCreate]: END successful validateCreate method`}]}
                return samolet
            }
    }

    async *validateUpdate(samolet: _specs_AirplaneItem, identity: IIdentity): AsyncGenerator<AartsPayload, _specs_AirplaneItem, undefined> {
        yield { resultItems: [{ message:  "SO THIS IS THE DOMAIN VALIDATE UPDATE METHOD"}]}
            return samolet
    }
}