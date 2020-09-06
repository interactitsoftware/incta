import { seedAirtoursData } from "./testDataSeeder"
import { AartsEvent } from "aarts-types/interfaces"

export class _specs_DataImporter {
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

    public async start(__type: string, args: AartsEvent): Promise<_specs_DataImporter>{
        this.date_started = new Date().toISOString()

        try {
            this.items_imported = await seedAirtoursData()
        } catch (err) {
            this.exit_code = "1"
            this.errors = [err]
            throw err;
        }

        this.date_ended = new Date().toISOString()

        return this
    }

    public date_started?: string
    public date_ended?: string
    public items_imported?: number
    public exit_code?: string
    public errors?: string[]
}
