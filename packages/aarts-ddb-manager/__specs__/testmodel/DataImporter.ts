import { IIdentity } from "aarts-types/interfaces"
import { BaseDynamoItemManager, DynamoCommandItem } from "../../BaseItemManager"
import { ppjson } from "aarts-utils"
import { _specs_DataImporterItem } from "./_DynamoItems"
import { seedAirtoursData } from "aarts-ddb/__specs__/testmodel/testDataSeeder"

export class _specs_DataImporter extends DynamoCommandItem {
    constructor(...args: any[]) {
        super()
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
}


export class _specs_DataImporterManager extends BaseDynamoItemManager<_specs_DataImporterItem> {

    async *validateStart(proc: _specs_DataImporterItem, identity: IIdentity): AsyncGenerator<string, _specs_DataImporterItem, never> {
        console.log("VALIDATE STARTING " + ppjson(proc))
        const errors: string[] = []
        // can apply further domain logic on permissions, authorizations etc
        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    async execute(proc: _specs_DataImporterItem, ringToken: string): Promise<_specs_DataImporterItem> {

        await seedAirtoursData()

        return proc
    }
}

