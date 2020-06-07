
export class TestModel_Flight { 
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }

    //-- ref keys
    public airplane?: string
    public from_airport?: string
    public to_airport?: string
    public from_country?: string
    public to_country?: string
    public flight_code?: string 
    //-- rest of keys
    public durration_hours?: number
    public tourist_season?: string


}


