import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { AllTouristForTouristSeasonItem, FlightItem, TouristItem, TouristSeasonItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager } from "aarts-types/interfaces"
import { loginfo, ppjson, versionString } from "aarts-utils"
import { DynamoItem, queryItems, RefKey } from "aarts-ddb"
import { MixinConstructor } from "aarts-types"
import { TouristSeason } from "../__bootstrap/items/TouristSeason"

export class AllTouristForTouristSeasonQuery extends BaseDynamoItemManager<AllTouristForTouristSeasonItem> {
    // Custom Queries are BaseDynamoItemManagers with overwritten query method. 
    // Code will not call validateQuery and __ValidateQuery in this case, unless you explicitly call them
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload<AllTouristForTouristSeasonItem>, undefined> {
        const allTouristsForSeason: TouristItem[] = []


        const flightRefKeyConfig = (((global.domainAdapter.lookupItems as unknown) as Map<string, MixinConstructor<typeof DynamoItem>>).get(FlightItem.__type)?.__refkeys as Map<string, RefKey<FlightItem>>);
        !process.env.DEBUGGER || loginfo({ ringToken: args.meta.ringToken }, `ref keys config for (${FlightItem.__type}) `, ppjson(flightRefKeyConfig))
        const Flight_tourist_seasonRK = flightRefKeyConfig.get("tourist_season") as RefKey<FlightItem>
        !process.env.DEBUGGER || loginfo({ ringToken: args.meta.ringToken }, `ref key config for Flight}tourist_season is`, ppjson(Flight_tourist_seasonRK))
        const gsiFlight_tourist_season = Flight_tourist_seasonRK?.gsiKey && Flight_tourist_seasonRK?.gsiKey[0] as string

        const touristRefKeyConfig = (((global.domainAdapter.lookupItems as unknown) as Map<string, MixinConstructor<typeof DynamoItem>>).get(TouristItem.__type)?.__refkeys as Map<string, RefKey<TouristItem>>);
        !process.env.DEBUGGER || loginfo({ ringToken: args.meta.ringToken }, `ref keys config for (${TouristItem.__type}) `, ppjson(flightRefKeyConfig))
        const Tourist_flightRK = touristRefKeyConfig.get("flight") as RefKey<TouristItem>
        !process.env.DEBUGGER || loginfo({ ringToken: args.meta.ringToken }, `ref key config for Tourist}flight is`, ppjson(Tourist_flightRK))
        const gsiTourist_flight = Tourist_flightRK?.gsiKey && Tourist_flightRK?.gsiKey[0] as string

        let nextPageFlights
        do {
            const allFlightsInTouristSeason = await queryItems({
                ddbIndex: `${gsiFlight_tourist_season}__smetadata`,
                pk: (args.payload.arguments as AllTouristForTouristSeasonItem).touristSeason as string,
                range: FlightItem.__type,
                primaryKeyName: `${gsiFlight_tourist_season}`,
                rangeKeyName: "smetadata",
                ringToken: args.meta.ringToken
            });
            nextPageFlights = allFlightsInTouristSeason.nextPage

            for (const flight of allFlightsInTouristSeason.items) {
                let nextPageTourists
                do {
                    const allTouristsReservationsForThisFlight = await queryItems({
                        ddbIndex: `${gsiTourist_flight}__smetadata`,
                        pk: flight.id,
                        range: TouristItem.__type,
                        primaryKeyName: `${gsiTourist_flight}`,
                        rangeKeyName: "smetadata",
                        loadPeersLevel: 1,
                        peersPropsToLoad: ["flight"],
                        ringToken: args.meta.ringToken
                    });
                    nextPageTourists = allTouristsReservationsForThisFlight.nextPage
                    console.log("NEXT PAGE TOURISTS IS " + ppjson(nextPageTourists))
                    console.log("results are: ", ppjson(allTouristsReservationsForThisFlight.items))

                    for (const tourist of allTouristsReservationsForThisFlight.items) {
                        allTouristsForSeason.push(tourist as TouristItem)
                    }

                } while (!!nextPageTourists && Object.keys(nextPageTourists).length > 0)
            }
        } while (!!nextPageFlights && Object.keys(nextPageFlights).length > 0)

        return { result: { items: allTouristsForSeason, nextPage: null } }
    }
}