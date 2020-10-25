import { _specs_AirportItem } from "./_DynamoItems"

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