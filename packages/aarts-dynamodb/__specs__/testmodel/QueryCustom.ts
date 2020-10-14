import { AartsEvent, AartsPayload } from "aarts-types/interfaces"
import { loginfo, versionString } from "aarts-utils/utils"
import { BaseDynamoItemManager, DynamoItem } from "../../BaseItemManager"
import { batchGetItem } from "../../dynamodb-batchGetItem"
import { queryItems } from "../../dynamodb-queryItems"
import { _specs_Flight } from "./Flight"
import { _specs_AirportItem, _specs_FlightItem, _specs_QueryCustomItem } from "./_DynamoItems"

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
        !process.env.DEBUGGER || loginfo('query Received arguments aaaaaaa: ', JSON.stringify(args, null, 4))
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:QUERY] Begin query method. Doing a gate check of payload` }] })

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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:QUERY] End` }] })
        // const res = (airports.items as DynamoItem[]).concat(flights.items as DynamoItem[])
        // console.log("===========LLLLLLLLLLLLLLLL============= RESULT FROM CUSTOM QUERY", res)
        
        // yield { resultItems: [{items:res}] }
        return { resultItems: [airports] }
    }

}