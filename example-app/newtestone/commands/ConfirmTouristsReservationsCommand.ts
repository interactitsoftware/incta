
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { ConfirmTouristsReservationsItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { queryItems, versionString } from "aarts-dynamodb"
import { ppjson } from "aarts-utils"

export class ConfirmTouristsReservationsCommand extends BaseDynamoItemManager<ConfirmTouristsReservationsItem> {

    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: ConfirmTouristsReservationsItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, ConfirmTouristsReservationsItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start CreateTourists Failed'
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: ConfirmTouristsReservationsItem, identity: IIdentity, ringToken: string): Promise<ConfirmTouristsReservationsItem> {
        // TODO 
        // - load all tourists for tourists season
        // - if tourists season is null load all tourists present
        // for each tourist - update state to confirmed 
        if (!!proc.touristSeason) {
            let nextPage
            do {
                // TODO get all flights in that touristSeason 
                // TODO get all tourists for all the flights
                const allTouristsReservationsForSeason = await queryItems({
                    ddbIndex: "smetadata__meta",
                    pk: proc.touristSeason,
                    range: `${versionString(0)}|Tourist`,
                    primaryKeyName: "smetadata",
                    rangeKeyName: "meta",
                    ringToken
                });
                nextPage = allTouristsReservationsForSeason.nextPage

                allTouristsReservationsForSeason.items.forEach(
                    tourist => {
                        if (!!proc.cancelledReservations && proc.cancelledReservations.indexOf(tourist.id) > -1) {
                            this.eventsForAsyncProcessing.push({
                                "action": "update",
                                "item": TouristItem.__type,
                                "arguments": {
                                    id: tourist.id,
                                    revisions: tourist.revisions,
                                    item_state: "cancelled"
                                },
                                "identity": {
                                    "username": "akrsmv"
                                }
                            })
                        } else {
                            // set status to confirmed and also set the refkey to tourist_season
                            this.eventsForAsyncProcessing.push({
                                "action": "update",
                                "item": TouristItem.__type,
                                "arguments": {
                                    id: tourist.id,
                                    revisions: tourist.revisions,
                                    item_state: "confirmed",
                                    tourist_season: tourist.Flight.tourist_season
                                },
                                "identity": {
                                    "username": "akrsmv"
                                }
                            })
                        }
                    })
            } while (!!nextPage)
        } else {
            console.log("WILL UPDATE ALLL TOURISTS")
            let nextPage
            do {
                const allTouristsReservations = await queryItems({
                    ddbIndex: "meta__id",
                    pk: `${versionString(0)}|Tourist`,
                    primaryKeyName: "meta",
                    rangeKeyName: "id",
                    loadPeersLevel:1,
                    peersPropsToLoad: ["flight"],
                    ringToken
                });
                nextPage = allTouristsReservations.nextPage
                console.log("NEX PAGE IS " + nextPage)
                console.log("results are: ", ppjson(allTouristsReservations.items))

                for (const tourist of allTouristsReservations.items) {
                    if (!!proc.cancelledReservations && proc.cancelledReservations.indexOf(tourist.id) > -1) {
                        this.eventsForAsyncProcessing.push({
                            "action": "update",
                            "item": TouristItem.__type,
                            "arguments": {
                                id: tourist.id,
                                revisions: tourist.revisions,
                                item_state: "cancelled"
                            },
                            "identity": {
                                "username": "akrsmv"
                            }
                        })
                    } else {
                        // set status to confirmed and also set the refkey to tourist_season
                        this.eventsForAsyncProcessing.push({
                            "action": "update",
                            "item": TouristItem.__type,
                            "arguments": {
                                id: tourist.id,
                                revisions: tourist.revisions,
                                item_state: "confirmed",
                                tourist_season: tourist.Flight.tourist_season
                            },
                            "identity": {
                                "username": "akrsmv"
                            }
                        })
                    }
                }
            } while (!!nextPage && Object.keys(nextPage).length > 0)
        }


        return proc
    }
}
