
export class TestModel_Country { 
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }
    //-- ref keys
    //-- rest of keys
    public name: string = ""
    public currency: string = ""
    public code: string = ""
}
