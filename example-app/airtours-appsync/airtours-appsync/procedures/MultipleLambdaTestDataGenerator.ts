/**
 * 
 * make this lambda only firing events for create
 */

import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { AartsEvent, IIdentity } from "aarts-types/interfaces";
import { MultipleLambdaTestDataGeneratorItem, AirportItem, CountryItem } from "../_DynamoItems"
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { AppSyncEvent } from "aarts-eb-types/aartsEBUtil";
import AWS from "aws-sdk";
import { AartsSqsHandler } from "aarts-eb-handler/aartsSqsHandler";
import * as idGenUtil from 'aarts-types/utils'
import { _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem, _specs_AirplaneItem, _specs_FlightItem, _specs_TouristItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems";

export class MultipleLambdaTestDataGenerator {

    public total_events: number = 0
    public succsess?: number
    public error?: number
    public processed_events?: boolean
    public start_date?: number
    public end_date?: number

    private publishAndRegister(event: AppSyncEvent) {
        dispatcher(event)
        this.total_events++
    }
    public async start(__type: string, args: AartsEvent) {
        const domainHandler = new AartsSqsHandler()
        this.start_date = Date.now()

        // 7 countries
        var bg_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "Bulgaria", currency: "BGN", code: "BG"})).resultItems[0]
        var sr_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "Serbia", currency: "RSD", code: "SR"})).resultItems[0]
        var ru_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "Russia", currency: "RUB", code: "RU"})).resultItems[0]
        var ch_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "China", currency: "CNY", code: "CH"})).resultItems[0]
        var us_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "United States", currency: "USD", code: "US"})).resultItems[0]
        var uk_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "United Kingdom", currency: "GBP", code: "GB"})).resultItems[0]
        var au_country = (await this.createItem(args.meta.ringToken as string, domainHandler, CountryItem.__type, {name: "Australia", currency: "AUD", code: "AUS"})).resultItems[0]

        // 10 airports
        const bg_airport_sf = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Sofia", country: bg_country.id, airport_size: 10.2})).resultItems[0]
        const bg_airport_bs = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Bourgas", country: bg_country.id, airport_size: 13.2})).resultItems[0]
        const sr_airport_bg = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Belgrade", country: sr_country.id, airport_size: 15.5})).resultItems[0]
        const ch_airport_bj = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Beijing", country: ch_country.id, airport_size: 50.2})).resultItems[0]
        const us_airport_ke = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Kenedi", country: us_country.id, airport_size: 30.7})).resultItems[0]
        const uk_airport_ln = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "London", country: uk_country.id, airport_size: 40.1})).resultItems[0]
        const au_airport_sy = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Sydney", country: au_country.id, airport_size: 45.3})).resultItems[0]
        const ru_airport_mw = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Moscow", country: ru_country.id, airport_size: 33.9})).resultItems[0]
        const ru_airport_pt = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "St. Petersburg", country: ru_country.id, airport_size: 33.1})).resultItems[0]
        const ru_airport_ng = (await this.createItem(args.meta.ringToken as string, domainHandler, AirportItem.__type, {name: "Novgorod", country: ru_country.id, airport_size: 15.5})).resultItems[0]

        // 5 airplanes - by 2 different manifacturers, of 3 different models
        // the manifacturers
        const boeing = (await this.createItem(args.meta.ringToken as string, domainHandler,_specs_AirplaneManifacturerItem.__type, { name: "Boeing", country: us_country.id })).resultItems[0]
        const irkut = (await this.createItem(args.meta.ringToken as string, domainHandler,_specs_AirplaneManifacturerItem.__type, { name: "Irkut", country: ru_country.id })).resultItems[0]
        // the models
        const model_787 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneModelItem.__type, { name: "Boeing 787", country: us_country.id, manifacturer: boeing.id })).resultItems[0]
        const model_mc21 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneModelItem.__type, { name: "MC-21", country: ru_country.id, manifacturer: irkut.id })).resultItems[0]
        const model_tu144 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneModelItem.__type, { name: "TU-144", country: ru_country.id, manifacturer: irkut.id })).resultItems[0]
        // the planes
        const plane_mc21_reg111 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneItem.__type, { number_of_seats: 15, reg_uq_str: "reg111", reg_uq_number: 111, country: ru_country.id, manifacturer: irkut.id, model: model_mc21.id })).resultItems[0]
        const plane_tu144_reg222 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneItem.__type, { number_of_seats: 25, reg_uq_str: "reg222", reg_uq_number: 222, country: ru_country.id, manifacturer: irkut.id, model: model_tu144.id })).resultItems[0]
        const plane_tu144_reg333 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneItem.__type, { number_of_seats: 15, reg_uq_str: "reg333", reg_uq_number: 333, country: ru_country.id, manifacturer: irkut.id, model: model_tu144.id })).resultItems[0]
        const plane_b787_reg444 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneItem.__type, { number_of_seats: 50, reg_uq_str: "reg444", reg_uq_number: 444, country: us_country.id, manifacturer: boeing.id, model: model_787.id })).resultItems[0]
        const plane_b787_reg555 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_AirplaneItem.__type, { number_of_seats: 100, reg_uq_str: "reg555", reg_uq_number: 555, country: us_country.id, manifacturer: boeing.id, model: model_787.id })).resultItems[0]

        // 20 flights
        const flight_sf_mw = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 10, flight_code: "F1", airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id })).resultItems[0]
        const flight_sf_bj = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F2", airplane: plane_tu144_reg333.id, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id })).resultItems[0]
        const flight_sf_mw1 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F3", airplane: plane_tu144_reg222.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id })).resultItems[0]

        const flight_bj_mw = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F4", airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id })).resultItems[0]
        const flight_bj_ke = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F5", airplane: plane_tu144_reg333.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id })).resultItems[0]
        const flight_bj_ke1 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F6", airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id })).resultItems[0]
        const flight_bj_sy = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F7", airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id })).resultItems[0]

        const flight_mw_ke = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F8", airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id })).resultItems[0]
        const flight_mw_sf = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F9", airplane: plane_tu144_reg222.id, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id })).resultItems[0]
        const flight_mw_pt = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F10", airplane: plane_b787_reg555.id, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id })).resultItems[0]

        const flight_sy_bj = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F11", airplane: plane_b787_reg444.id, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id })).resultItems[0]
        const flight_sy_ln = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F12", airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id })).resultItems[0]
        const flight_sy_ke = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 2, flight_code: "F13", airplane: plane_tu144_reg333.id, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id })).resultItems[0]

        const flight_sr_sf = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F14", airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id })).resultItems[0]
        const flight_sr_ke = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F15", airplane: plane_tu144_reg333.id, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id })).resultItems[0]

        const flight_ke_sf = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q2", duration_hours: 5, flight_code: "F16", airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id })).resultItems[0]
        const flight_ke_mw = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q2", duration_hours: 4, flight_code: "F17", airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id })).resultItems[0]
        const flight_ke_mw1 = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q2", duration_hours: 5, flight_code: "F18", airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id })).resultItems[0]

        const flight_pt_mw = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q3", duration_hours: 5, flight_code: "F19", airplane: plane_tu144_reg333.id, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id })).resultItems[0]
        const flight_pt_sf = (await this.createItem(args.meta.ringToken as string, domainHandler, _specs_FlightItem.__type, { tourist_season: "2021/Q3", duration_hours: 7, flight_code: "F20", airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id })).resultItems[0]

        // // many tourists - 392
        // //flight_sf_mw
        for (let i = 0; i < 2; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sf_mw.id, airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id })
        }
        //flight_sf_bj
        for (let i = 0; i < 30; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sf_bj.id, airplane: plane_tu144_reg333.id, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id })
        }
        //flight_sf_mw1
        for (let i = 0; i < 40; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sf_mw1.id, airplane: plane_tu144_reg222.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id })
        }
        //flight_bj_mw
        for (let i = 0; i < 50; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_bj_mw.id, airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id })
        }
        //flight_bj_ke
        for (let i = 0; i < 10; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_bj_ke.id, airplane: plane_tu144_reg333.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id })
        }
        //flight_bj_ke1
        for (let i = 0; i < 15; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_bj_ke1.id, airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id })
        }
        //flight_bj_sy
        for (let i = 0; i < 20; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_bj_sy.id, airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id })
        }
        //flight_mw_ke
        for (let i = 0; i < 40; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_mw_ke.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id })
        }
        //flight_mw_sf
        for (let i = 0; i < 30; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_mw_sf.id, airplane: plane_tu144_reg222.id, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id })
        }
        //flight_mw_pt
        for (let i = 0; i < 20; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_mw_pt.id, airplane: plane_b787_reg555.id, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id })
        }
        //flight_sy_bj
        for (let i = 0; i < 1; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sy_bj.id, airplane: plane_b787_reg444.id, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id })
        }
        //flight_sy_ln
        for (let i = 0; i < 5; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sy_ln.id, airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id })
        }
        //flight_sy_ke
        for (let i = 0; i < 9; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sy_ke.id, airplane: plane_tu144_reg333.id, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id })
        }
        //flight_sr_sf
        for (let i = 0; i < 4; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sr_sf.id, airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id })
        }
        //flight_sr_ke
        for (let i = 0; i < 7; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_sr_ke.id, airplane: plane_tu144_reg333.id, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id })
        }
        //flight_ke_sf
        for (let i = 0; i < 11; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_ke_sf.id, airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id })
        }
        //flight_ke_mw
        for (let i = 0; i < 66; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_ke_mw.id, airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id })
        }
        //flight_ke_mw1
        for (let i = 0; i < 2; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_ke_mw1.id, airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id })
        }

        //flight_pt_mw
        for (let i = 0; i < 10; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_pt_mw.id, airplane: plane_tu144_reg333.id, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id })
        }
        //flight_pt_sf
        for (let i = 0; i < 20; i++) {
            this.createItemByPublishingToSns(_specs_TouristItem.__type, { flight: flight_pt_sf.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id })
        }

        //439 count nr of events for items to be inserted

        return this;
    }

    /**
     * Not calling another lambda, but directly triggering the domain logic (we have access to it already!)
     * @param name 
     * @param currency 
     * @param code 
     * @param parentRingToken 
     * @param domainHandler 
     */
    private async createItem(parentRingToken: string, domainHandler: AartsSqsHandler, __type: string, itemBody: Record<string,any>) {
        return await domainHandler.processPayload({
            "payload": {
                "arguments": {
                    "procedure": (this as DynamoItem).id,
                    ...itemBody
                },
                "identity": {
                    "username": "akrsmv"
                }
            },
            "meta": {
                "action": "create",
                "item": __type,
                "eventSource": "worker:input",
                "ringToken": parentRingToken + "_"+ idGenUtil.uuid()
            }
        })
    }

    /**
     * Asynchronously creating a country - passing through dispatcher lambda (because we are publishing to SNS here), TODO should we do this at all ?
     * Why not again calling a (same?) domain handler (still, there are the options of calling synchronously or asynchronously on the service object level!)
     * Left like this for example and reference
     * NOTE that each item created from here will be now created in the context of a new ring token. There is still the procedure id though, by which we can reference
     * @param name name of airport
     * @param country id of country the airport is located
     * @param airport_size square kilometers of the airport
     */
    private createItemByPublishingToSns(__type: string, itemBody: Record<string, any>) {
        this.publishAndRegister({
            "action": "create",
            "item": __type,
            "arguments": {
                "procedure": (this as DynamoItem).id,
                ...itemBody
            },
            "identity": {
                "username": "akrsmv"
            }
        })
    }

    /**
     * this is an attempt to call another lambda. However we need to define it first as right now its not very comfortable calling the domain logic like this
     * WE NEED a lambda which handler is accepting AartsEvent (i.e backed by AartsHandler)
     * This method left for reference and further dev. Not working atm
     * @param name 
     * @param currency 
     * @param code 
     */
    private async createCountryByCallingAartsInAnotherLambda(name: string, currency: string, code: string) {

        // NOTE in order to do it synchronously we need another lambda that accepts pure json payload, not SQS envelopes
        // unless we want to create the envelope structure ourselves.. below code is NOT WORKING, exactly because of this


        const lambda = new AWS.Lambda({
            maxRetries: 2,
            retryDelayOptions: {
                //TODO figure out good enough backoff function
                customBackoff: (retryCount: number, err) => {
                    process.env.DEBUG && console.log(new Date() + ": retrying attempt:" + retryCount + ". ERROR " + JSON.stringify(err, null, 4))
                    // expecting to retry
                    // 1st attempt: 110 ms
                    // 2nd attempt: 200 ms
                    // 3rd attempt: 1300 ms

                    return 100 ^ (retryCount / 2) + (retryCount / 2) * 200;
                }
            }
        })

        const sqsEvent = JSON.stringify({
            "action": "create",
            "item": "country",
            "arguments": {
                "procedure": (this as DynamoItem).id,
                "name": name,
                "code": code,
                "currency": currency
            },
            "identity": {
                "username": "akrsmv"
            }
        })

        return await lambda.invoke(
            {
                FunctionName: process.env.AARTS_SQS_HANDLER as string,
                Payload: sqsEvent
            }, (err, data) => {
                console.log("[AWS_SAM_LOCAL]: SNS DISPATCHER PROCESSED EVENT " + sqsEvent)
            }).promise()
    }
}

export class MultipleLambdaTestDataGeneratorManager extends BaseDynamoItemManager<MultipleLambdaTestDataGeneratorItem> {

    async *validateStart(proc: MultipleLambdaTestDataGeneratorItem, identity: IIdentity): AsyncGenerator<string, MultipleLambdaTestDataGeneratorItem, undefined> {
        const errors: string[] = []
        // can apply some domain logic on permissions, authorizations etc
        return proc
    }

}