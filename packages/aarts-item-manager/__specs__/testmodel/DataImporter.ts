import { seedAirtoursData } from "./testDataSeeder"
import { AartsEvent, AartsPayload, IIdentity } from "aarts-types/interfaces"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { _specs_AirportItem, _specs_DataImporterItem } from "./_DynamoItems"
import { ppjson } from "aarts-utils"

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
    total_events: number = 0
    start_date?: Date
    sync_end_date?: Date
    async_end_date?: Date
    processed_events?: number
    errors?: string[]
}


export class _specs_DataImporterManager extends BaseDynamoItemManager<_specs_DataImporterItem> {

    async *validateStart(proc: AartsPayload<_specs_DataImporterItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        console.log("VALIDATE STARTING " + ppjson(proc))
        const errors: string[] = []
        // can apply further domain logic on permissions, authorizations etc
        // if this method returns without throwing error, the execute method will be called 

        proc.arguments.start_date = Date.now()
        return proc
    }

    async execute(__type: string, args: AartsEvent): Promise<_specs_DataImporterItem> {

        await seedAirtoursData()



        return args.payload.arguments as _specs_DataImporterItem
    }
}

