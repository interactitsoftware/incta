import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { AirplaneItem, AirplaneManifacturerItem, AirplaneModelItem, AirportItem, CountryItem, FlightItem, GenerateAirtoursDataItem, TouristItem, TouristSeasonItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager } from "aarts-types/interfaces"
import { queryItems, DynamoItem } from "aarts-ddb"
import { processPayload } from "aarts-eb-handler"
import { uuid } from "aarts-utils"
import { TouristSeason } from "../__bootstrap/items/TouristSeason"
import { names } from "./random-names/names"


export class GenerateAirtoursDataCommand extends BaseDynamoItemManager<GenerateAirtoursDataItem> {

    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: GenerateAirtoursDataItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, GenerateAirtoursDataItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Start GenerateAirtoursData Failed`
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
* Command Implementation
*/
    async execute(proc: GenerateAirtoursDataItem, identity: IIdentity, ringToken: string): Promise<GenerateAirtoursDataItem> {

        const alreadyProcessed: {items: DynamoItem[] } = {items : []} 
        // = await queryItems({
        //     ddbIndex: "smetadata__meta",
        //     pk: ringToken,
        //     primaryKeyName: "smetadata",
        //     rangeKeyName: "meta",
        //     ringToken
        // });

        // console.log("===============================");
        // console.log("ALREADY PROCESSED ARE: ", alreadyProcessed.items.length)
        // console.log("===============================");



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
            ringToken,
            CountryItem.__type,
            bg_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_sr_country = await this.createItem(
            ringToken,
            CountryItem.__type,
            sr_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_ru_country = await this.createItem(
            ringToken,
            CountryItem.__type,
            ru_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_ch_country = await this.createItem(
            ringToken,
            CountryItem.__type,
            ch_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_us_country = await this.createItem(
            ringToken,
            CountryItem.__type,
            us_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_uk_country = await this.createItem(
            ringToken,
            CountryItem.__type,
            uk_country,
            "name",
            alreadyProcessed.items as DynamoItem[])
        const dynamo_au_country = await this.createItem(
            ringToken,
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
            ringToken,
            AirportItem.__type,
            bg_airport_sf,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_bg_airport_bs = await this.createItem(
            ringToken,
            AirportItem.__type,
            bg_airport_bs,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_sr_airport_bg = await this.createItem(
            ringToken,
            AirportItem.__type,
            sr_airport_bg,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ch_airport_bj = await this.createItem(
            ringToken,
            AirportItem.__type,
            ch_airport_bj,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_us_airport_ke = await this.createItem(
            ringToken,
            AirportItem.__type,
            us_airport_ke,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_uk_airport_ln = await this.createItem(
            ringToken,
            AirportItem.__type,
            uk_airport_ln,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_au_airport_sy = await this.createItem(
            ringToken,
            AirportItem.__type,
            au_airport_sy,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ru_airport_mw = await this.createItem(
            ringToken,
            AirportItem.__type,
            ru_airport_mw,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ru_airport_pt = await this.createItem(
            ringToken,
            AirportItem.__type,
            ru_airport_pt,
            "name",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_ru_airport_ng = await this.createItem(
            ringToken,
            AirportItem.__type,
            ru_airport_ng,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        // 5 airplanes - by 2 different manifacturers, of 3 different models
        // the manifacturers
        const boeing = { name: "Boeing manifacturer", country: dynamo_us_country.id }
        const irkut = { name: "Irkut manifacturer", country: dynamo_ru_country.id }

        const dynamo_boeing = await this.createItem(
            ringToken,
            AirplaneManifacturerItem.__type,
            boeing,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_irkut = await this.createItem(
            ringToken,
            AirplaneManifacturerItem.__type,
            irkut,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        // the models
        const model_787 = { name: "Boeing 787", country: dynamo_us_country.id, manifacturer: dynamo_boeing.id }
        const model_mc21 = { name: "MC-21", country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id }
        const model_tu144 = { name: "TU-144", country: dynamo_ru_country.id, manifacturer: dynamo_irkut.id }

        const dynamo_model_787 = await this.createItem(
            ringToken,
            AirplaneModelItem.__type,
            model_787,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_model_mc21 = await this.createItem(
            ringToken,
            AirplaneModelItem.__type,
            model_mc21,
            "name",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_model_tu144 = await this.createItem(
            ringToken,
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
            ringToken,
            AirplaneItem.__type,
            plane_mc21_reg111,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_tu144_reg222 = await this.createItem(
            ringToken,
            AirplaneItem.__type,
            plane_tu144_reg222,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_tu144_reg333 = await this.createItem(
            ringToken,
            AirplaneItem.__type,
            plane_tu144_reg333,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_b787_reg444 = await this.createItem(
            ringToken,
            AirplaneItem.__type,
            plane_b787_reg444,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_plane_b787_reg555 = await this.createItem(
            ringToken,
            AirplaneItem.__type,
            plane_b787_reg555,
            "reg_uq_str",
            (alreadyProcessed.items as DynamoItem[]))

        // 7 tourist seasons
        const q4_2020: TouristSeason = { code: "2020/Q4", price_flight_per_hour: 13, discounts: { vip: 50, class_1: 20, class_2: 40 } }
        const q1_2021: TouristSeason = { code: "2021/Q1", price_flight_per_hour: 15, discounts: { vip: 30, class_1: 10, class_2: 20 } }
        const q2_2021: TouristSeason = { code: "2021/Q2", price_flight_per_hour: 19, discounts: { vip: 60, class_1: 20, class_2: 40 } }
        const q3_2021: TouristSeason = { code: "2021/Q3", price_flight_per_hour: 50, discounts: { vip: 35, class_1: 10, class_2: 20 } }
        const q4_2021: TouristSeason = { code: "2021/Q4", price_flight_per_hour: 40, discounts: { vip: 45, class_1: 10, class_2: 20 } }
        const q1_2022: TouristSeason = { code: "2022/Q1", price_flight_per_hour: 35, discounts: { vip: 45, class_1: 11, class_2: 23 } }
        const q2_2022: TouristSeason = { code: "2022/Q2", price_flight_per_hour: 35, discounts: { vip: 30, class_1: 11, class_2: 25 } }

        const dynamo_q4_2020 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q4_2020,
            "code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_q1_2021 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q1_2021,
            "code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_q2_2021 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q2_2021,
            "code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_q3_2021 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q3_2021,
            "code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_q4_2021 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q4_2021,
            "code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_q1_2022 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q1_2022,
            "code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_q2_2022 = await this.createItem(
            ringToken,
            TouristSeasonItem.__type,
            q2_2022,
            "code",
            (alreadyProcessed.items as DynamoItem[]))

        // 20 flights
        const flight_sf_mw = { tourist_season: dynamo_q4_2020.id, duration_hours: 10, flight_code: "F1", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_bg_country.id, to_country: dynamo_ru_country.id }
        const flight_sf_bj = { tourist_season: dynamo_q4_2020.id, duration_hours: 15, flight_code: "F2", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ch_airport_bj.id, from_country: dynamo_bg_country.id, to_country: dynamo_ch_country.id }
        const flight_sf_mw1 = { tourist_season: dynamo_q4_2020.id, duration_hours: 15, flight_code: "F3", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_bg_airport_sf.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_bg_country.id, to_country: dynamo_ru_country.id }

        const flight_bj_mw = { tourist_season: dynamo_q1_2021.id, duration_hours: 7, flight_code: "F4", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_ch_country.id, to_country: dynamo_ru_country.id }
        const flight_bj_ke = { tourist_season: dynamo_q1_2021.id, duration_hours: 22, flight_code: "F5", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ch_country.id, to_country: dynamo_us_country.id }
        const flight_bj_ke1 = { tourist_season: dynamo_q1_2021.id, duration_hours: 22, flight_code: "F6", airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ch_country.id, to_country: dynamo_us_country.id }
        const flight_bj_sy = { tourist_season: dynamo_q1_2021.id, duration_hours: 23, flight_code: "F7", airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_ch_airport_bj.id, to_airport: dynamo_au_airport_sy.id, from_country: dynamo_ch_country.id, to_country: dynamo_au_country.id }

        const flight_mw_ke = { tourist_season: dynamo_q2_2021.id, duration_hours: 11, flight_code: "F8", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_ru_country.id, to_country: dynamo_us_country.id }
        const flight_mw_sf = { tourist_season: dynamo_q2_2021.id, duration_hours: 16, flight_code: "F9", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_ru_country.id, to_country: dynamo_bg_country.id }
        const flight_mw_pt = { tourist_season: dynamo_q2_2021.id, duration_hours: 3, flight_code: "F10", airplane: dynamo_plane_b787_reg555.id, from_airport: dynamo_ru_airport_mw.id, to_airport: dynamo_ru_airport_pt.id, from_country: dynamo_ru_country.id, to_country: dynamo_ru_country.id }

        const flight_sy_bj = { tourist_season: dynamo_q3_2021.id, duration_hours: 15, flight_code: "F11", airplane: dynamo_plane_b787_reg444.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_ch_airport_bj.id, from_country: dynamo_au_country.id, to_country: dynamo_ch_country.id }
        const flight_sy_ln = { tourist_season: dynamo_q3_2021.id, duration_hours: 10, flight_code: "F12", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_uk_airport_ln.id, from_country: dynamo_au_country.id, to_country: dynamo_uk_country.id }
        const flight_sy_ke = { tourist_season: dynamo_q3_2021.id, duration_hours: 2, flight_code: "F13", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_au_airport_sy.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_au_country.id, to_country: dynamo_us_country.id }

        const flight_sr_sf = { tourist_season: dynamo_q4_2021.id, duration_hours: 1, flight_code: "F14", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_sr_airport_bg.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_sr_country.id, to_country: dynamo_bg_country.id }
        const flight_sr_ke = { tourist_season: dynamo_q4_2021.id, duration_hours: 9, flight_code: "F15", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_sr_airport_bg.id, to_airport: dynamo_us_airport_ke.id, from_country: dynamo_sr_country.id, to_country: dynamo_us_country.id }

        const flight_ke_sf = { tourist_season: dynamo_q1_2022.id, duration_hours: 15, flight_code: "F16", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_us_country.id, to_country: dynamo_bg_country.id }
        const flight_ke_mw = { tourist_season: dynamo_q1_2022.id, duration_hours: 10, flight_code: "F17", airplane: dynamo_plane_tu144_reg222.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_us_country.id, to_country: dynamo_ru_country.id }
        const flight_ke_mw1 = { tourist_season: dynamo_q1_2022.id, duration_hours: 10, flight_code: "F18", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_us_airport_ke.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_us_country.id, to_country: dynamo_ru_country.id }

        const flight_pt_mw = { tourist_season: dynamo_q2_2022.id, duration_hours: 3, flight_code: "F19", airplane: dynamo_plane_tu144_reg333.id, from_airport: dynamo_ru_airport_pt.id, to_airport: dynamo_ru_airport_mw.id, from_country: dynamo_ru_country.id, to_country: dynamo_ru_country.id }
        const flight_pt_sf = { tourist_season: dynamo_q2_2022.id, duration_hours: 6, flight_code: "F20", airplane: dynamo_plane_mc21_reg111.id, from_airport: dynamo_ru_airport_pt.id, to_airport: dynamo_bg_airport_sf.id, from_country: dynamo_ru_country.id, to_country: dynamo_bg_country.id }


        const dynamo_flight_sf_mw = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sf_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sf_bj = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sf_bj,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sf_mw1 = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sf_mw1,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_bj_mw = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_bj_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_bj_ke = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_bj_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_bj_ke1 = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_bj_ke1,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_bj_sy = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_bj_sy,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_mw_ke = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_mw_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_mw_sf = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_mw_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_mw_pt = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_mw_pt,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_sy_bj = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sy_bj,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sy_ln = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sy_ln,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sy_ke = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sy_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_sr_sf = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sr_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_sr_ke = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_sr_ke,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_ke_sf = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_ke_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_ke_mw = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_ke_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_ke_mw1 = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_ke_mw1,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const dynamo_flight_pt_mw = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_pt_mw,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))
        const dynamo_flight_pt_sf = await this.createItem(
            ringToken,
            FlightItem.__type,
            flight_pt_sf,
            "flight_code",
            (alreadyProcessed.items as DynamoItem[]))

        const totalTouristsToAdd = Number(proc.touristsToCreate || 0)
        const touristsPerFlight = totalTouristsToAdd / 20 // test data have 20 flights in total
        const namesLenght = proc.useNamesLength || names.length
        // many tourists
        // //flight_sf_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sf_mw.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_bg_airport_sf.id,
                    to_airport: dynamo_ru_airport_mw.id,
                    from_country: dynamo_bg_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }

        //flight_sf_bj
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sf_bj.id,
                    airplane: dynamo_plane_tu144_reg333.id,
                    from_airport: dynamo_bg_airport_sf.id,
                    to_airport: dynamo_ch_airport_bj.id,
                    from_country: dynamo_bg_country.id,
                    to_country: dynamo_ch_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_sf_mw1
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sf_mw1.id,
                    airplane: dynamo_plane_tu144_reg222.id,
                    from_airport: dynamo_bg_airport_sf.id,
                    to_airport: dynamo_ru_airport_mw.id,
                    from_country: dynamo_bg_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_bj_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_bj_mw.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_ch_airport_bj.id,
                    to_airport: dynamo_ru_airport_mw.id,
                    from_country: dynamo_ch_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_bj_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_bj_ke.id,
                    airplane: dynamo_plane_tu144_reg333.id,
                    from_airport: dynamo_ch_airport_bj.id,
                    to_airport: dynamo_us_airport_ke.id,
                    from_country: dynamo_ch_country.id,
                    to_country: dynamo_us_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_bj_ke1
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_bj_ke1.id,
                    airplane: dynamo_plane_b787_reg444.id,
                    from_airport: dynamo_ch_airport_bj.id,
                    to_airport: dynamo_us_airport_ke.id,
                    from_country: dynamo_ch_country.id,
                    to_country: dynamo_us_country.id

                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_bj_sy
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_bj_sy.id,
                    airplane: dynamo_plane_b787_reg444.id,
                    from_airport: dynamo_ch_airport_bj.id,
                    to_airport: dynamo_au_airport_sy.id,
                    from_country: dynamo_ch_country.id,
                    to_country: dynamo_au_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_mw_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_mw_ke.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_ru_airport_mw.id,
                    to_airport: dynamo_us_airport_ke.id,
                    from_country: dynamo_ru_country.id,
                    to_country: dynamo_us_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_mw_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_mw_sf.id,
                    airplane: dynamo_plane_tu144_reg222.id,
                    from_airport: dynamo_ru_airport_mw.id,
                    to_airport: dynamo_bg_airport_sf.id,
                    from_country: dynamo_ru_country.id,
                    to_country: dynamo_bg_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_mw_pt
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_mw_pt.id,
                    airplane: dynamo_plane_b787_reg555.id,
                    from_airport: dynamo_ru_airport_mw.id,
                    to_airport: dynamo_ru_airport_pt.id,
                    from_country: dynamo_ru_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_sy_bj
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sy_bj.id,
                    airplane: dynamo_plane_b787_reg444.id,
                    from_airport: dynamo_au_airport_sy.id,
                    to_airport: dynamo_ch_airport_bj.id,
                    from_country: dynamo_au_country.id,
                    to_country: dynamo_ch_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_sy_ln
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sy_ln.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_au_airport_sy.id,
                    to_airport: dynamo_uk_airport_ln.id,
                    from_country: dynamo_au_country.id,
                    to_country: dynamo_uk_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_sy_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sy_ke.id,
                    airplane: dynamo_plane_tu144_reg333.id,
                    from_airport: dynamo_au_airport_sy.id,
                    to_airport: dynamo_us_airport_ke.id,
                    from_country: dynamo_au_country.id,
                    to_country: dynamo_us_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_sr_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sr_sf.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_sr_airport_bg.id,
                    to_airport: dynamo_bg_airport_sf.id,
                    from_country: dynamo_sr_country.id,
                    to_country: dynamo_bg_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_sr_ke
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_sr_ke.id,
                    airplane: dynamo_plane_tu144_reg333.id,
                    from_airport: dynamo_sr_airport_bg.id,
                    to_airport: dynamo_us_airport_ke.id,
                    from_country: dynamo_sr_country.id,
                    to_country: dynamo_us_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_ke_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_ke_sf.id,
                    airplane: dynamo_plane_tu144_reg222.id,
                    from_airport: dynamo_us_airport_ke.id,
                    to_airport: dynamo_bg_airport_sf.id,
                    from_country: dynamo_us_country.id,
                    to_country: dynamo_bg_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_ke_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_ke_mw.id,
                    airplane: dynamo_plane_tu144_reg222.id,
                    from_airport: dynamo_us_airport_ke.id,
                    to_airport: dynamo_ru_airport_mw.id,
                    from_country: dynamo_us_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_ke_mw1
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_ke_mw1.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_us_airport_ke.id,
                    to_airport: dynamo_ru_airport_mw.id,
                    from_country: dynamo_us_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }

        //flight_pt_mw
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_pt_mw.id,
                    airplane: dynamo_plane_tu144_reg333.id,
                    from_airport: dynamo_ru_airport_pt.id,
                    to_airport: dynamo_ru_airport_mw.id,
                    from_country: dynamo_ru_country.id,
                    to_country: dynamo_ru_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }
        //flight_pt_sf
        for (let i = 0; i < touristsPerFlight; i++) {
            this.eventsForAsyncProcessing.push({
                "action": "create",
                "item": TouristItem.__type,
                "arguments": prepareTouristToCreate(
                    namesLenght, {
                    flight: dynamo_flight_pt_sf.id,
                    airplane: dynamo_plane_mc21_reg111.id,
                    from_airport: dynamo_ru_airport_pt.id,
                    to_airport: dynamo_bg_airport_sf.id,
                    from_country: dynamo_ru_country.id,
                    to_country: dynamo_bg_country.id
                }),
                "identity": {
                    "username": "akrsmv"
                }
            })
        }

        return proc as GenerateAirtoursDataItem
    }

    private createAirport(args: Record<string, string | number> & { code: string, type: string }, parentbranch?: string) {
        return {
            ...args,
            "branch": `${parentbranch ? parentbranch + "#" : ""}${args.code}-${args.type}`
        }
    }
    private async createItem(
        ringToken: string,
        __type: string,
        itemBody: Record<string, any>,
        uqKeyTocheck: string | number,
        processedItems: DynamoItem[]) {
        const processedItem = processedItems && processedItems.filter(i => i[uqKeyTocheck] === itemBody[uqKeyTocheck])
        if (processedItem && processedItem.length > 0) {
            // reduce the total_events expected as this item was already present and we will not issue a tx for it
            return (processedItem[0] as unknown) as DynamoItem
        } else {
            return (await processPayload({
                "payload": {
                    "arguments": {
                        ...itemBody,
                        __proc: (this as DynamoItem).id

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
            })).payload.result.result
        }
    }
}

const prepareTouristToCreate = (
    namesLenght: number,
    touristData: {
        flight: string,
        airplane: string,
        from_airport: string,
        to_airport: string,
        from_country: string,
        to_country: string
    }) => {

    const fn = names[~~(Math.random() * namesLenght)]
    const ln = names[~~(Math.random() * namesLenght)]
    let generatedIban = 0
    for (const ch of `${fn}${ln}`) {
        generatedIban += ch.charCodeAt(0)
    }
    return {
        // some random id card adn iban. NOTE still possible for large nr of tourists to generate same id_card, 
        // in this case second insert will be error as id_card is set to be unique
        iban: `BGSOF${generatedIban}#${uuid()}`,
        id_card: (~~(Math.random() * 1000000) + ~~(Math.random() * 1000000) + ~~(Math.random() * 1000000)),
        ticket_type: ["class_1", "class_2", "vip"][~~(Math.random() * 3)],
        fname: fn,
        lname: ln,
        item_state: "reservation",
        ...touristData
    }
}
