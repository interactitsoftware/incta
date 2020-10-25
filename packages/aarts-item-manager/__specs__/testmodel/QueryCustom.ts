import { AartsEvent, AartsPayload } from "aarts-types/interfaces"
import { loginfo, versionString } from "aarts-utils"
import { DynamoItem } from "aarts-dynamodb"
import { batchGetItem } from "aarts-dynamodb"
import { queryItems } from "aarts-dynamodb"
import { _specs_Flight } from "./Flight"
import { _specs_AirportItem, _specs_FlightItem, _specs_QueryCustomItem } from "./_DynamoItems"
import { BaseDynamoItemManager } from "../../BaseItemManager"

export class _specs_QueryCustom { 

    public invoice?: string
    public item?:string
    public price?:number
    public quantity?:number
    public discount?:number
    public vat?:number
}

export class _specs_QueryCustomManager extends BaseDynamoItemManager<_specs_QueryCustomItem> {
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo('query Received arguments bbbbbbb: ', args)

        // get all airports in europe
        const airports = await queryItems({
            pk: `${versionString(0)}|${_specs_AirportItem.__type}`,
            ddbIndex: "meta__id",
            primaryKeyName: "meta",
            rangeKeyName: "id"
        });

        // get all flights related to those airports ('to' or 'from')
        const flights = await queryItems({ 
            pk: `${_specs_FlightItem.__type}}to_airport`,
            primaryKeyName: "meta",
            rangeKeyName: "smetadata",
            ddbIndex: "meta__smetadata"
        });

        
        const res = (airports.items as DynamoItem[]).concat(flights.items as DynamoItem[])
        
        !process.env.DEBUGGER || loginfo(`[${item}:QUERY] End. Results: `,  { resultItems: [res] })
        // yield { resultItems: [{items:res}] }
        return { resultItems: [res] }
    }

}