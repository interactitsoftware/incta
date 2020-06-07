export class TestModel_Nomenclature {
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }

    public name: string = ""
}
