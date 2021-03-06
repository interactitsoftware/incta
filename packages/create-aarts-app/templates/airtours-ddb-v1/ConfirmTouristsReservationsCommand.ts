export const ConfirmTouristsReservationsCommand = 
`import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { AllTouristForTouristSeasonItem, ConfirmTouristsReservationsItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { queryItems, versionString } from "aarts-dynamodb"
import { ppjson } from "aarts-utils"
import { domainAdapter } from "../__bootstrap"
import { AllTouristForTouristSeasonQuery } from "../queries/AllTouristForTouristSeasonQuery"

export class ConfirmTouristsReservationsCommand extends BaseDynamoItemManager<ConfirmTouristsReservationsItem> {

    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: ConfirmTouristsReservationsItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, ConfirmTouristsReservationsItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start CreateTourists Failed'
            throw new Error(\`\${errors.join(";;")}\`)
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
            const queryGenerator = (domainAdapter.itemManagers[AllTouristForTouristSeasonItem.__type] as BaseDynamoItemManager<AllTouristForTouristSeasonItem>).query(
                {
                    meta: {
                        action: "query",
                        item: "x",
                        eventSource: "worker:input",
                        ringToken: proc.ringToken as string
                    },
                    payload: {
                        arguments: {
                            touristSeason: proc.touristSeason
                        },
                        identity: {

                        }
                    }
                }
            )
            let result = await queryGenerator.next()
            while (!result.done) {
                result = await queryGenerator.next()
            }

            console.log("RESULT FROM Query AllTouristForTouristSeasonItem is " + ppjson(result.value));

            (result.value.result.items as TouristItem[]).forEach(
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
        } else {
            console.log("WILL UPDATE ALLL TOURISTS")
            let nextPage
            do {
                const allTouristsReservations = await queryItems({
                    ddbIndex: "meta__id",
                    pk: \`\${versionString(0)}|Tourist\`,
                    primaryKeyName: "meta",
                    rangeKeyName: "id",
                    loadPeersLevel: 1,
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
`