
export class _specs_Flight { 
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
    //-- ref keys
    public airplane?: string
    public from_airport?: string
    public to_airport?: string
    public from_country?: string
    public to_country?: string
    public flight_code?: string 
    public duration_hours?: number
    public tourist_season?: string
    public price_1st_class?: number
    public price_2nd_class?: number
    public price_vip?: number

}


