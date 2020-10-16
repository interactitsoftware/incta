import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { queryItems } from "aarts-dynamodb/dynamodb-queryItems"
import { AartsEvent, AartsPayload } from "aarts-types/interfaces"
import { loginfo, ppjson, versionString } from "aarts-utils/utils"
import { AirportItem, FlightItem, QueryCustom1Item } from "../__aarts/_DynamoItems"


export class QueryCustom1Manager extends BaseDynamoItemManager<QueryCustom1Item> {
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo('query Received arguments: ', JSON.stringify(args, null, 4))
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:QUERY] Begin query method. Doing a gate check of payload` }] })

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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:QUERY] End` }] })
        const res = (airports.items as DynamoItem[]).concat(flights.items as DynamoItem[])
        console.log("^^AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA^^^ RES ", ppjson(res))
        return { resultItems: [{items:[res]}] }
    }

}