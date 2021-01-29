import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { AllTouristForTouristSeasonItem, ConfirmTouristsReservationsItem, FlightItem, TouristItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { queryItems, versionString, DynamoItem } from "aarts-ddb"
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
                                meta: tourist.meta,
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
                                meta: tourist.meta,
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

            const updateShardsPromises = []
            

            const updateSingleShard = async (shardNr : number) : Promise<void> => {
                let nextPage
                do {
                    const allTouristsReservations = await queryItems({
                        ddbIndex: "nshard__smetadata",
                        pk: shardNr,
                        range: `${TouristItem.__type}|`,
                        primaryKeyName: "nshard",
                        rangeKeyName: "smetadata",
                        loadPeersLevel: 1,
                        peersPropsToLoad: ["Flight"],
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
                                    meta: tourist.meta,
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
                                    meta: tourist.meta,
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

            for (let i = 0; i < 10; i++) {
                updateShardsPromises.push(updateSingleShard(i))
            }

            await Promise.all(updateShardsPromises).then(result => console.log("UPDATED ALL TOURISTS USING SHARDS"), err => {console.log("THERE WAS AN ERR: ", err); throw err;})
        }

        return proc
    }
    public onCreate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onCreate logic in here or delete this method*/
        // console.log("ON CREATE TRIGGERED for " + __type)
    }
    public onUpdate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onUpdate logic in here or delete this method*/
        // console.log("ON UPDATE TRIGGERED for " + __type)
    }
    public onSuccess = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onSuccess logic in here or delete this method*/
        // console.log("ON SUCCESS TRIGGERED for " + __type)
    }
    public onError = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onError logic in here or delete this method*/
        // console.log("ON ERROR TRIGGERED for " + __type)
    }
}