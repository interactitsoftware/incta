import { DynamoItem } from "aarts-dynamodb"
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { queryItems } from "aarts-dynamodb/dynamodb-queryItems"
import { AartsEvent, AartsPayload } from "aarts-types/interfaces"
import { loginfo, ppjson, versionString } from "aarts-utils"
import { AirportItem, FlightItem, QueryCustom1Item } from "../__bootstrap/_DynamoItems"


export class QueryCustom1Manager extends BaseDynamoItemManager<QueryCustom1Item> {
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo(`[${item}:QUERY] Received arguments:`, args)

        // get all airports in europe
        const airports = await queryItems({
            pk: `${versionString(0)}|${AirportItem.__type}`,
            ddbIndex: "meta__id",
            primaryKeyName: "meta",
            rangeKeyName: "id"
        });

        // get all flights related to those airports ('to' or 'from')
        const flights = await queryItems({ 
            pk: `${FlightItem.__type}}to_airport`,
            primaryKeyName: "meta",
            rangeKeyName: "smetadata",
            ddbIndex: "meta__smetadata"
        });

        const res = (airports.items as DynamoItem[]).concat(flights.items as DynamoItem[])
        !process.env.DEBUGGER || loginfo(`[${item}:QUERY] End. Result: `, res)
        
        return { resultItems: [{items:[res]}] }
    }

}