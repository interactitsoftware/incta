export class TestModel_Tourist {
    
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }

    public airplane: string = ""
    public flight: string = ""
    public from_airport: string = ""
    public to_airport: string = ""
    public from_country: string = ""
    public to_country: string = ""
}