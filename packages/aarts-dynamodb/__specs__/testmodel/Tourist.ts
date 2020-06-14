export class _specs_Tourist {
    
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

    public airplane: string = ""
    public flight: string = ""
    public from_airport: string = ""
    public to_airport: string = ""
    public from_country: string = ""
    public to_country: string = ""
}