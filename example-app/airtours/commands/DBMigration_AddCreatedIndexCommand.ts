import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { CountryItem, DBMigration_AddCreatedIndexItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { getItemsOfType, queryItems } from "aarts-dynamodb"
import { DBMigration_AddCreatedIndex } from "../__bootstrap/items/DBMigration_AddCreatedIndex"


export class DBMigration_AddCreatedIndexCommand extends BaseDynamoItemManager<DBMigration_AddCreatedIndexItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: AartsPayload<DBMigration_AddCreatedIndexItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Start DBMigration_AddCreatedIndex Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<DBMigration_AddCreatedIndexItem> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        var countries = await getItemsOfType(CountryItem.__type)
        for(const c of countries) {
            this.eventsForAsyncProcessing.push({
                action:"create",
                item: "BASE",
                identity: {
                    username:"test"
                },
                arguments: {
                    id: c.id,
                    meta: `${CountryItem.__type}}date_created`,
                    smetadata: c.date_created
                }
            })
        }

        return args.payload.arguments as DBMigration_AddCreatedIndexItem
    }
}
