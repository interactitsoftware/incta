import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { AllTouristForTouristSeasonItem, FlightItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager } from "aarts-types/interfaces"
import { ppjson, versionString } from "aarts-utils"
import { queryItems } from "aarts-dynamodb"

export class AllTouristForTouristSeasonQuery extends BaseDynamoItemManager<AllTouristForTouristSeasonItem> {
    // Custom Queries are BaseDynamoItemManagers with overwritten query method. 
    // Code will not call validateQuery and __ValidateQuery in this case, unless you explicitly call them
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload<AllTouristForTouristSeasonItem>, undefined> {
        const allTouristsForSeason: TouristItem[] = []
        let nextPage
        do {
            const allFlightsInTouristSeason = await queryItems({
                ddbIndex: "meta__smetadata",
                pk: "Flight}tourist_season",
                range: (args.payload.arguments as AllTouristForTouristSeasonItem).touristSeason as string,
                primaryKeyName: "meta",
                rangeKeyName: "smetadata",
                ringToken: args.meta.ringToken
            });
            nextPage = allFlightsInTouristSeason.nextPage

            for (const flight of allFlightsInTouristSeason.items) {
                let nextPageTourists
                do {
                    const allTouristsReservationsForThisFlight = await queryItems({
                        ddbIndex: "meta__smetadata",
                        pk: "Tourist}flight",
                        range: flight.id,
                        primaryKeyName: "meta",
                        rangeKeyName: "smetadata",
                        loadPeersLevel: 1,
                        peersPropsToLoad: ["flight"],
                        ringToken: args.meta.ringToken
                    });
                    nextPageTourists = allTouristsReservationsForThisFlight.nextPage
                    console.log("NEX PAGE TOURISTS IS " + ppjson(nextPageTourists))
                    console.log("results are: ", ppjson(allTouristsReservationsForThisFlight.items))

                    for (const tourist of allTouristsReservationsForThisFlight.items) {
                        allTouristsForSeason.push(tourist as TouristItem)
                    }

                } while (!!nextPageTourists && Object.keys(nextPageTourists).length > 0)
            }
        } while (!!nextPage && Object.keys(nextPage).length > 0)

        return { result: { items: allTouristsForSeason, nextPage: null } }
    }
}