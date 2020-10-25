export class _specs_TouristSeason { 
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
    public discounts:{vip:number, class_2: number, class_1: number} = {vip:30, class_2: 5, class_1: 15}
    public code?:string
    public price_flight_per_hour?:number
}
