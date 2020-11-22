import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { AirportItem, DBMigration_AddCreatedIndexForAirportItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { getItemsOfType } from "aarts-dynamodb"


export class DBMigration_AddCreatedIndexForAirportCommand extends BaseDynamoItemManager<DBMigration_AddCreatedIndexForAirportItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: DBMigration_AddCreatedIndexForAirportItem): AsyncGenerator<string, DBMigration_AddCreatedIndexForAirportItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Start DBMigration_AddCreatedIndexForAirport Failed`
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<DBMigration_AddCreatedIndexForAirportItem> { 

        var airports = await getItemsOfType(AirportItem.__type)
        for(const a of airports) {
            this.eventsForAsyncProcessing.push({
                action:"create",
                item: "BASE",
                identity: {
                    username:"test"
                },
                arguments: {
                    id: a.id,
                    meta: `${AirportItem.__type}}date_created`,
                    smetadata: a.date_created
                }
            })
        }

        return args.payload.arguments as DBMigration_AddCreatedIndexForAirportItem
    }
}
