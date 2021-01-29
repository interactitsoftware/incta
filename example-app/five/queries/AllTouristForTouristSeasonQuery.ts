import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { AllTouristForTouristSeasonItem, FlightItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"
import { getItems } from "aarts-ddb"

export class AllTouristForTouristSeasonQuery extends BaseDynamoItemManager<AllTouristForTouristSeasonItem> {
    // Custom Queries are BaseDynamoItemManagers with overwritten query method. 
    // Code will not call validateQuery and __ValidateQuery in this case, unless you explicitly call them

    // guery TOURISTS with THESE STATUSES, THAT have THIS REFERENCE
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload<AllTouristForTouristSeasonItem>, undefined> {


        const allTouristsForSeason: TouristItem[] = []
        let nextPage
        do {
            const allFlightsInTouristSeason = await getItems<FlightItem>({
                __type: FlightItem.__type,
                state: '',
                itemProp: 'tourist_season',
                itemPropValue: (args.payload.arguments as AllTouristForTouristSeasonItem).touristSeason as string,
                ringToken: args.meta.ringToken
            });
            nextPage = allFlightsInTouristSeason.nextPage

            console.log(`Next Page with potential flight results for tourist season ${(args.payload.arguments as AllTouristForTouristSeasonItem).touristSeason} is: ` + ppjson(nextPage))
            console.log(`Flight results in this page for touristseason ${(args.payload.arguments as AllTouristForTouristSeasonItem).touristSeason} are: `, ppjson(allFlightsInTouristSeason.items))

            for (const flight of allFlightsInTouristSeason.items) {
                let nextPageTourists
                do {
                    const allTouristsReservationsForThisFlight = await getItems<TouristItem>({
                        __type: TouristItem.__type,
                        state: '',
                        itemProp: 'flight',
                        itemPropValue: flight.id,
                        ringToken: args.meta.ringToken,
                        loadPeersLevel: 1,
                        peersPropsToLoad: ["Flight"],
                    });

                    nextPageTourists = allTouristsReservationsForThisFlight.nextPage
                    console.log(`Next Page with potential tourists results for flight ${flight.id} is: ` + ppjson(nextPageTourists))
                    console.log(`Tourist results inthis page pfor flight ${flight.id} are: `, ppjson(allTouristsReservationsForThisFlight.items))

                    for (const tourist of allTouristsReservationsForThisFlight.items) {
                        allTouristsForSeason.push(tourist as TouristItem)
                    }

                } while (!!nextPageTourists && Object.keys(nextPageTourists).length > 0)
            }
        } while (!!nextPage && Object.keys(nextPage).length > 0)

        return { result: { items: allTouristsForSeason, nextPage: null } }
    }
}