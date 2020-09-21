import { queryItems } from "aarts-dynamodb/dynamodb-queryItems"
import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { AartsEvent, AartsPayload, IIdentity } from "aarts-types/interfaces";
import { AirportItem, CountryItem, AirplaneManifacturerItem, AirplaneModelItem, IdmptChunksMultipleLambdaTestDataGeneratorItem } from "../_DynamoItems"
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { AppSyncEvent, loginfo } from "aarts-eb-types/aartsEBUtil";
import AWS from "aws-sdk";
import { AartsSqsHandler } from "aarts-eb-handler/aartsSqsHandler";
import { _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem, _specs_AirplaneItem, _specs_FlightItem, _specs_TouristItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems";
import { _specs_Airport } from "aarts-dynamodb/__specs__/testmodel/Airport";
import { _specs_Country } from "aarts-dynamodb/__specs__/testmodel/Country";
import { names } from "./random-names/names";
import { chunks } from "aarts-utils/utils";

const tourist_payloads: any[] = []

/**
 * This is a combined experiment of both creating items from within the procedure and also by publishing to SNS
 * 
 * The  *idmpt* part - it has to do with the loading of items already created *BY THIS SAME PROCEDURE*. I.t this is an experiment where retrying the same lambda will still operate. 
 * Because items created from here (the 47 in total airplane, country etc.. ) also have unique keys, if some other procedure (with *DIFFERENT* ringToken) creates them the idmpt part is not working, as we load all the items by ringToken
 * 
 * The *chunks* part - it has to do with sending the events in batches of 25 (configurable) so that more events could be sent from within one lambda. Later each chunk (array of events) is further split into single events and again published
 * It is adding on top of the idmpt-multiple experiment where we see there is a pretty low upper limit of events that could be published in 20 minutes (the long worker lambda timeout)
 */

export class IdmptChunksMultipleLambdaTestDataGenerator {

    public total_events: number = 0
    public processed_events: number = 0
    public succsess?: number
    public error?: number
    public start_date?: number
    public end_date?: number

    public touristsToCreate?: number
    public on_finish?: string[] = ['proc_produce_tourists_csv','proc_send_welcome_email']

    private async registerForPublishing(event: AppSyncEvent) {
        tourist_payloads.push(event.arguments)
    }
    private createAirport(args: Record<string, string | number> & { code: string, type: string }, parentbranch?: string) {
        return {
            ...args,
            "branch": `${parentbranch ? parentbranch + "#" : ""}${args.code}-${args.type}`
        }
    }
    private async createItem(
        ringToken: string,
        domainHandler: AartsSqsHandler,
        __type: string,
        itemBody: Record<string, any>,
        uqKeyTocheck: string | number,
        processedItems: DynamoItem[]) {
        const processedItem = processedItems && processedItems.filter(i => i[uqKeyTocheck] === itemBody[uqKeyTocheck])
        if (processedItem && processedItem.length > 0) {
            // reduce the total_events expected as this item was already present and we will not issue a tx for it
            return (processedItem[0] as unknown) as DynamoItem
        } else {
            return (await domainHandler.processPayload({
                "payload": {
                    "arguments": {
                        ...itemBody,
                        procedure: (this as DynamoItem).id

                    },
                    "identity": {
                        "username": "akrsmv"
                    }
                },
                "meta": {
                    "action": "create",
                    "item": __type,
                    "eventSource": "worker:input",
                    "ringToken": ringToken
                }
            })).resultItems[0]
        }
    }

    public async start(__type: string, args: AartsEvent) {
        const domainHandler = new AartsSqsHandler()
        this.start_date = Date.now()

        const alreadyProcessed = await queryItems({
            ddbIndex: "smetadata__meta",
            pk: args.meta.ringToken as string,
            primaryKeyName: "smetadata",
            rangeKeyName: "meta"
        });

        console.log("===============================");
        console.log("ALREADY PROCESSED ARE: ", alreadyProcessed.count)
        console.log("===============================");



        // jsons for create
        // 7 countries

        const bg_country = { name: "Bulgaria", currency: "BGN", code: "BG" }
        const sr_country = { name: "Serbia", currency: "RSD", code: "SR" }
        const ru_country = { name: "Russia", currency: "RUB", code: "RU" }
        const ch_country = { name: "China", currency: "CNY", code: "CH" }
        const us_country = { name: "United States", currency: "USD", code: "US" }
        const uk_country = { name: "United Kingdom", currency: "GBP", code: "GB" }
        const au_country = { name: "Australia", currency: "AUD", code: "AUS" }

        const dynamo_bg_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            bg_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_sr_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            sr_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_ru_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            ru_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_ch_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            ch_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_us_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            us_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_uk_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            uk_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_au_country = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            CountryItem.__type,
            au_country,
            "name",
            alreadyProcessed.items as DynamoItem[])

        // 10 airports
        const bg_airport_sf = this.createAirport({ type: "regional", code: dynamo_bg_country.code, name: "Sofia airport", country: dynamo_bg_country.id, airport_size: 10.2 })
        const bg_airport_bs = this.createAirport({ type: "regional", code: dynamo_bg_country.code, name: "Bourgas airport", country: dynamo_bg_country.id, airport_size: 13.2 })
        const sr_airport_bg = this.createAirport({ type: "regional", code: dynamo_sr_country.code, name: "Belgrade airport", country: dynamo_sr_country.id, airport_size: 15.5 })
        const ch_airport_bj = this.createAirport({ type: "regional", code: dynamo_ch_country.code, name: "Beijing airport", country: dynamo_ch_country.id, airport_size: 50.2 })
        const us_airport_ke = this.createAirport({ type: "regional", code: dynamo_us_country.code, name: "Kenedi airport", country: dynamo_us_country.id, airport_size: 30.7 })
        const uk_airport_ln = this.createAirport({ type: "regional", code: dynamo_uk_country.code, name: "London airport", country: dynamo_uk_country.id, airport_size: 40.1 })
        const au_airport_sy = this.createAirport({ type: "regional", code: dynamo_au_country.code, name: "Sydney airport", country: dynamo_au_country.id, airport_size: 45.3 })
        const ru_airport_mw = this.createAirport({ type: "regional", code: dynamo_ru_country.code, name: "Moscow airport", country: dynamo_ru_country.id, airport_size: 33.9 })
        const ru_airport_pt = this.createAirport({ type: "regional", code: dynamo_ru_country.code, name: "St. Petersburg airport", country: dynamo_ru_country.id, airport_size: 33.1 })
        const ru_airport_ng = this.createAirport({ type: "regional", code: dynamo_ru_country.code, name: "Novgorod airport", country: dynamo_ru_country.id, airport_size: 15.5 })

        const dynamo_bg_airport_sf = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            bg_airport_sf,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_bg_airport_bs = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            bg_airport_bs,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_sr_airport_bg = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            sr_airport_bg,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ch_airport_bj = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            ch_airport_bj,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_us_airport_ke = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            us_airport_ke,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_uk_airport_ln = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            uk_airport_ln,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_au_airport_sy = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            au_airport_sy,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ru_airport_mw = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            ru_airport_mw,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ru_airport_pt = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            ru_airport_pt,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ru_airport_ng = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirportItem.__type,
            ru_airport_ng,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        // 5 airplanes - by 2 different manifacturers, of 3 different models
        // the manifacturers
        const boeing = { name: "Boeing manifacturer", country: dynamo_us_country.id }
        const irkut = { name: "Irkut manifacturer", country: dynamo_ru_country.id }

        const dynamo_boeing = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirplaneManifacturerItem.__type,
            boeing,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_irkut = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirplaneManifacturerItem.__type,
            irkut,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        // the models
        const model_787 = { name: "Boeing 787", country: dynamo_us_country.id, manifacturer: dynamo_boeing.id }
        const model_mc21 = { name: "MC-21", country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id }
        const model_tu144 = { name: "TU-144", country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id }

        const dynamo_model_787 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirplaneModelItem.__type,
            model_787,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_model_mc21 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirplaneModelItem.__type,
            model_mc21,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_model_tu144 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            AirplaneModelItem.__type,
            model_tu144,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        // the planes
        const plane_mc21_reg111 = { number_of_seats: 15, reg_uq_str: "reg111", reg_uq_number: 111, country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id, model: dynamo_model_mc21.id }
        const plane_tu144_reg222 = { number_of_seats: 25, reg_uq_str: "reg222", reg_uq_number: 222, country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id, model: dynamo_model_tu144.id }
        const plane_tu144_reg333 = { number_of_seats: 15, reg_uq_str: "reg333", reg_uq_number: 333, country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id, model: dynamo_model_tu144.id }
        const plane_b787_reg444 = { number_of_seats: 50, reg_uq_str: "reg444", reg_uq_number: 444, country: dynamo_us_country.id, manifacturer: dynamo_boeing.id, model: dynamo_model_787.id }
        const plane_b787_reg555 = { number_of_seats: 100, reg_uq_str: "reg555", reg_uq_number: 555, country: dynamo_us_country.id, manifacturer: dynamo_boeing.id, model: dynamo_model_787.id }

        const dynamo_plane_mc21_reg111 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_AirplaneItem.__type,
            plane_mc21_reg111,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_tu144_reg222 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_AirplaneItem.__type,
            plane_tu144_reg222,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_tu144_reg333 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_AirplaneItem.__type,
            plane_tu144_reg333,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_b787_reg444 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_AirplaneItem.__type,
            plane_b787_reg444,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_b787_reg555 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_AirplaneItem.__type,
            plane_b787_reg555,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))
        // 20 flights
        const flight_sf_mw = { tourist_season: "2021/Q1", duration_hours: 10, flight_code: "F1", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_bg_country.id, to_country: dynamo_ru_country.id }
        const flight_sf_bj = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F2", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ch_airport_bj.id, from_country: dynamo_bg_country.id, to_country: dynamo_ch_country.id }
        const flight_sf_mw1 = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F3", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_bg_country.id, to_country: dynamo_ru_country.id }

        const flight_bj_mw = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F4", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_ch_country.id, to_country: dynamo_ru_country.id }
        const flight_bj_ke = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F5", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ch_country.id, to_country: dynamo_us_country.id }
        const flight_bj_ke1 = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F6", airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ch_country.id, to_country: dynamo_us_country.id }
        const flight_bj_sy = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F7", airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_au_airport_sy.id, from_country: dynamo_ch_country.id, to_country: dynamo_au_country.id }

        const flight_mw_ke = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F8", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ru_country.id, to_country: dynamo_us_country.id }
        const flight_mw_sf = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F9", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_ru_country.id, to_country: dynamo_bg_country.id }
        const flight_mw_pt = { tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F10", airplane: dynamo_plane_b787_reg555.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_ru_airport_pt.id, from_country: dynamo_ru_country.id, to_country: dynamo_ru_country.id }

        const flight_sy_bj = { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F11", airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_ch_airport_bj.id, from_country: dynamo_au_country.id, to_country: dynamo_ch_country.id }
        const flight_sy_ln = { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F12", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_uk_airport_ln.id, from_country: dynamo_au_country.id, to_country: dynamo_uk_country.id }
        const flight_sy_ke = { tourist_season: "2021/Q1", duration_hours: 2, flight_code: "F13", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_au_country.id, to_country: dynamo_us_country.id }

        const flight_sr_sf = { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F14", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_sr_airport_bg.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_sr_country.id, to_country: dynamo_bg_country.id }
        const flight_sr_ke = { tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F15", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_sr_airport_bg.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_sr_country.id, to_country: dynamo_us_country.id }

        const flight_ke_sf = { tourist_season: "2021/Q2", duration_hours: 5, flight_code: "F16", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_us_country.id, to_country: dynamo_bg_country.id }
        const flight_ke_mw = { tourist_season: "2021/Q2", duration_hours: 4, flight_code: "F17", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_us_country.id, to_country: dynamo_ru_country.id }
        const flight_ke_mw1 = { tourist_season: "2021/Q2", duration_hours: 5, flight_code: "F18", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_us_country.id, to_country: dynamo_ru_country.id }

        const flight_pt_mw = { tourist_season: "2021/Q3", duration_hours: 5, flight_code: "F19", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_ru_airport_pt.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_ru_country.id, to_country: dynamo_ru_country.id }
        const flight_pt_sf = { tourist_season: "2021/Q3", duration_hours: 7, flight_code: "F20", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ru_airport_pt.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_ru_country.id, to_country: dynamo_bg_country.id }


        const dynamo_flight_sf_mw = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sf_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sf_bj = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sf_bj,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sf_mw1 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sf_mw1,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_bj_mw = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_bj_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_bj_ke = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_bj_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_bj_ke1 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_bj_ke1,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_bj_sy = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_bj_sy,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_mw_ke = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_mw_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_mw_sf = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_mw_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_mw_pt = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_mw_pt,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_sy_bj = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sy_bj,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sy_ln = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sy_ln,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sy_ke = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sy_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_sr_sf = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sr_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sr_ke = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_sr_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_ke_sf = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_ke_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_ke_mw = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_ke_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_ke_mw1 = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_ke_mw1,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_pt_mw = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_pt_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_pt_sf = await this.createItem(
            args.meta.ringToken as string,
            domainHandler,
            _specs_FlightItem.__type,
            flight_pt_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const totalTouristsToAdd = Number(this.touristsToCreate || 0)
        const touristsPerFlight = totalTouristsToAdd / 20 // test data have 20 flights in total
        const namesLenght = names.length
        // many tourists
        // //flight_sf_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sf_mw.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sf_mw.id,
                airplane: dynamo_plane_mc21_reg111.id,
                from_airport: dynamo_bg_airport_sf.id,
                to_airport: dynamo_ru_airport_mw.id,
                from_country: dynamo_bg_country.id,
                to_country: dynamo_ru_country.id
            })
        }
        //flight_sf_bj
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sf_bj.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sf_bj.id, airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ch_airport_bj.id, from_country: dynamo_bg_country.id, to_country: dynamo_ch_country.id
            })
        }
        //flight_sf_mw1
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sf_mw1.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sf_mw1.id, airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_bg_country.id, to_country: dynamo_ru_country.id
            })
        }
        //flight_bj_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_bj_mw.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_bj_mw.id, airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_ch_country.id, to_country: dynamo_ru_country.id
            })
        }
        //flight_bj_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_bj_ke.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_bj_ke.id, airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ch_country.id, to_country: dynamo_us_country.id
            })
        }
        //flight_bj_ke1
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_bj_ke1.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_bj_ke1.id, airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ch_country.id, to_country: dynamo_us_country.id
            })
        }
        //flight_bj_sy
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_bj_sy.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_bj_sy.id, airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_au_airport_sy.id, from_country: dynamo_ch_country.id, to_country: dynamo_au_country.id
            })
        }
        //flight_mw_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_mw_ke.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_mw_ke.id, airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ru_country.id, to_country: dynamo_us_country.id
            })
        }
        //flight_mw_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_mw_sf.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_mw_sf.id, airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_ru_country.id, to_country: dynamo_bg_country.id
            })
        }
        //flight_mw_pt
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_mw_pt.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_mw_pt.id, airplane: dynamo_plane_b787_reg555.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_ru_airport_pt.id, from_country: dynamo_ru_country.id, to_country: dynamo_ru_country.id
            })
        }
        //flight_sy_bj
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sy_bj.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sy_bj.id, airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_ch_airport_bj.id, from_country: dynamo_au_country.id, to_country: dynamo_ch_country.id
            })
        }
        //flight_sy_ln
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sy_ln.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sy_ln.id, airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_uk_airport_ln.id, from_country: dynamo_au_country.id, to_country: dynamo_uk_country.id
            })
        }
        //flight_sy_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sy_ke.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sy_ke.id, airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_au_country.id, to_country: dynamo_us_country.id
            })
        }
        //flight_sr_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sr_sf.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sr_sf.id, airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_sr_airport_bg.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_sr_country.id, to_country: dynamo_bg_country.id
            })
        }
        //flight_sr_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_sr_ke.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_sr_ke.id, airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_sr_airport_bg.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_sr_country.id, to_country: dynamo_us_country.id
            })
        }
        //flight_ke_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_ke_sf.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_ke_sf.id, airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_us_country.id, to_country: dynamo_bg_country.id
            })
        }
        //flight_ke_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_ke_mw.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_ke_mw.id, airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_us_country.id, to_country: dynamo_ru_country.id
            })
        }
        //flight_ke_mw1
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_ke_mw1.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_ke_mw1.id, airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_us_country.id, to_country: dynamo_ru_country.id
            })
        }

        //flight_pt_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, {
                iban: `${dynamo_flight_pt_mw.flight_code}:${i}`,
                fname: names[~~(Math.random() * namesLenght)],
                lname: names[~~(Math.random() * namesLenght)],
                flight: dynamo_flight_pt_mw.id, airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_ru_airport_pt.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_ru_country.id, to_country: dynamo_ru_country.id
            })
        }
        //flight_pt_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type,
                {
                    iban: `${dynamo_flight_pt_sf.flight_code}:${i}`,
                    fname: names[~~(Math.random() * namesLenght)],
                    lname: names[~~(Math.random() * namesLenght)],
                    flight: dynamo_flight_pt_sf.id, airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ru_airport_pt.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_ru_country.id, to_country: dynamo_bg_country.id
                })
        }

        // we want to send all events, chunked into 25, that is why we only send them once all events are registered
        if (tourist_payloads.length > 0) {
            for (const chunk of chunks(tourist_payloads, Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25))) {
                await dispatcher({
                    "action": "create",
                    "item": _specs_TouristItem.__type,
                    "ringToken": args.meta.ringToken as string,
                    "jobType": "long",
                    "arguments": chunk,
                    "identity": {
                        "username": "akrsmv"
                    }
                })
            }
        }

        return this
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
    private async createItemByPublishingToSns(ringToken: string, __type: string, itemBody: Record<string, any>) {
        await this.registerForPublishing({
            "action": "create",
            "item": __type,
            "ringToken": ringToken,
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
                    !process.env.DEBUGGER || loginfo(new Date() + ": retrying attempt:" + retryCount + ". ERROR " + JSON.stringify(err, null, 4))
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

export class IdmptChunksMultipleLambdaTestDataGeneratorManager extends BaseDynamoItemManager<IdmptChunksMultipleLambdaTestDataGeneratorItem> {

    async *validateStart(proc: AartsPayload<IdmptChunksMultipleLambdaTestDataGeneratorItem>): AsyncGenerator<string, AartsPayload, undefined> {
        const errors: string[] = []
        proc.arguments.total_events = 47 + (proc.arguments.touristsToCreate || 0)
        // can apply some domain logic on permissions, authorizations etc
        return proc
    }

}