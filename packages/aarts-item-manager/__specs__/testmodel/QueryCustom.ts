import { AartsEvent, AartsPayload } from "aarts-types/interfaces"
import { loginfo, ppjson, versionString } from "aarts-utils"
import { DynamoItem } from "aarts-dynamodb"
import { queryItems } from "aarts-dynamodb"
import { AirportItem, FlightItem, _specs_QueryCustomItem } from "./_DynamoItems"
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
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo({ringToken: args.meta.ringToken}, 'query Received arguments bbbbbbb: ', ppjson(args))

        // get all airports in europe
        const airports = await queryItems({
            pk: `${versionString(0)}|${AirportItem.__type}`,
            ddbIndex: "meta__id",
            primaryKeyName: "meta",
            rangeKeyName: "id",
            ringToken: args.meta.ringToken
        });

        // get all flights related to those airports ('to' or 'from')
        const flights = await queryItems({ 
            pk: `${FlightItem.__type}}to_airport`,
            primaryKeyName: "meta",
            rangeKeyName: "smetadata",
            ddbIndex: "meta__smetadata",
            ringToken: args.meta.ringToken
        });

        
        const res = (airports.items as DynamoItem[]).concat(flights.items as DynamoItem[])
        
        !process.env.DEBUGGER || loginfo({ringToken: args.meta.ringToken}, `[${args.meta.item}:QUERY] End. Results: `,  ppjson({ result: res }))
        return { result: res }
    }

}