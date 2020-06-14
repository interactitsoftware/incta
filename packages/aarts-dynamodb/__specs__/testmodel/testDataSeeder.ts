import { transactPutItem } from "../../dynamodb-transactPutItem"
import { _specs_CountryItem, _specs_AirportItem, _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem, _specs_AirplaneItem, _specs_FlightItem, _specs_TouristItem } from "./_DynamoItems"

export const seedAirtoursData = async () : Promise<number> => {
    // 7 countries
    const bg_country = await transactPutItem(new _specs_CountryItem({ name: "Bulgaria" }), _specs_CountryItem.__refkeys)
    const sr_country = await transactPutItem(new _specs_CountryItem({ name: "Serbia" }), _specs_CountryItem.__refkeys)
    const ru_country = await transactPutItem(new _specs_CountryItem({ name: "Russia" }), _specs_CountryItem.__refkeys)
    const ch_country = await transactPutItem(new _specs_CountryItem({ name: "China" }), _specs_CountryItem.__refkeys)
    const us_country = await transactPutItem(new _specs_CountryItem({ name: "United States" }), _specs_CountryItem.__refkeys)
    const uk_country = await transactPutItem(new _specs_CountryItem({ name: "United Kingdom" }), _specs_CountryItem.__refkeys)
    const au_country = await transactPutItem(new _specs_CountryItem({ name: "Australia" }), _specs_CountryItem.__refkeys)
    // 10 airports
    const bg_airport_sf = await transactPutItem(new _specs_AirportItem({ name: "Sofia", country: bg_country.id }), _specs_AirportItem.__refkeys)
    const bg_airport_bs = await transactPutItem(new _specs_AirportItem({ name: "Bourgas", country: bg_country.id }), _specs_AirportItem.__refkeys)
    const sr_airport_bg = await transactPutItem(new _specs_AirportItem({ name: "Belgrade", country: sr_country.id }), _specs_AirportItem.__refkeys)
    const ch_airport_bj = await transactPutItem(new _specs_AirportItem({ name: "Beijing", country: ch_country.id }), _specs_AirportItem.__refkeys)
    const us_airport_ke = await transactPutItem(new _specs_AirportItem({ name: "Kenedi", country: us_country.id }), _specs_AirportItem.__refkeys)
    const uk_airport_ln = await transactPutItem(new _specs_AirportItem({ name: "London", country: uk_country.id }), _specs_AirportItem.__refkeys)
    const au_airport_sy = await transactPutItem(new _specs_AirportItem({ name: "Sydney", country: au_country.id }), _specs_AirportItem.__refkeys)
    const ru_airport_mw = await transactPutItem(new _specs_AirportItem({ name: "Moscow", country: ru_country.id }), _specs_AirportItem.__refkeys)
    const ru_airport_pt = await transactPutItem(new _specs_AirportItem({ name: "St. Petersburg", country: ru_country.id }), _specs_AirportItem.__refkeys)
    const ru_airport_ng = await transactPutItem(new _specs_AirportItem({ name: "Novgorod", country: ru_country.id }), _specs_AirportItem.__refkeys)
    // 5 airplanes - by 2 different manifacturers, of 3 different models
    // the manifacturers
    const boeing = await transactPutItem(new _specs_AirplaneManifacturerItem({ name: "Boeing", country: us_country.id }), _specs_AirplaneManifacturerItem.__refkeys)
    const irkut = await transactPutItem(new _specs_AirplaneManifacturerItem({ name: "Irkut", country: ru_country.id }), _specs_AirplaneManifacturerItem.__refkeys)
    // the models
    const model_787 = await transactPutItem(new _specs_AirplaneModelItem({ name: "Boeing 787", country: us_country.id, manifacturer: boeing.id }), _specs_AirplaneModelItem.__refkeys)
    const model_mc21 = await transactPutItem(new _specs_AirplaneModelItem({ name: "MC-21", country: ru_country.id, manifacturer: irkut.id }), _specs_AirplaneModelItem.__refkeys)
    const model_tu144 = await transactPutItem(new _specs_AirplaneModelItem({ name: "TU-144", country: ru_country.id, manifacturer: irkut.id }), _specs_AirplaneModelItem.__refkeys)
    // the planes
    const plane_mc21_reg111 = await transactPutItem(new _specs_AirplaneItem({ number_of_seats: 10, reg_uq_str: "reg111", reg_uq_number: 111, country: ru_country.id, manifacturer: irkut.id, model: model_mc21.id }), _specs_AirplaneItem.__refkeys)
    const plane_tu144_reg222 = await transactPutItem(new _specs_AirplaneItem({ number_of_seats: 25, reg_uq_str: "reg222", reg_uq_number: 222, country: ru_country.id, manifacturer: irkut.id, model: model_tu144.id }), _specs_AirplaneItem.__refkeys)
    const plane_tu144_reg333 = await transactPutItem(new _specs_AirplaneItem({ number_of_seats: 15, reg_uq_str: "reg333", reg_uq_number: 333, country: ru_country.id, manifacturer: irkut.id, model: model_tu144.id }), _specs_AirplaneItem.__refkeys)
    const plane_b787_reg444 = await transactPutItem(new _specs_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg444", reg_uq_number: 444, country: us_country.id, manifacturer: boeing.id, model: model_787.id }), _specs_AirplaneItem.__refkeys)
    const plane_b787_reg555 = await transactPutItem(new _specs_AirplaneItem({ number_of_seats: 100, reg_uq_str: "reg555", reg_uq_number: 555, country: us_country.id, manifacturer: boeing.id, model: model_787.id }), _specs_AirplaneItem.__refkeys)
  
    // 20 flights
    const flight_sf_mw = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 10, flight_code: "F1", airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
    const flight_sf_bj = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F2", airplane: plane_tu144_reg333.id, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id }), _specs_FlightItem.__refkeys)
    const flight_sf_mw1 = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F3", airplane: plane_tu144_reg222.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
  
    const flight_bj_mw = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F4", airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
    const flight_bj_ke = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F5", airplane: plane_tu144_reg333.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }), _specs_FlightItem.__refkeys)
    const flight_bj_ke1 = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F6", airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }), _specs_FlightItem.__refkeys)
    const flight_bj_sy = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F7", airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id }), _specs_FlightItem.__refkeys)
  
    const flight_mw_ke = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F8", airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id }), _specs_FlightItem.__refkeys)
    const flight_mw_sf = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F9", airplane: plane_tu144_reg222.id, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }), _specs_FlightItem.__refkeys)
    const flight_mw_pt = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 15, flight_code: "F10", airplane: plane_b787_reg555.id, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
  
    const flight_sy_bj = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F11", airplane: plane_b787_reg444.id, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id }), _specs_FlightItem.__refkeys)
    const flight_sy_ln = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F12", airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id }), _specs_FlightItem.__refkeys)
    const flight_sy_ke = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 2, flight_code: "F13", airplane: plane_tu144_reg333.id, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id }), _specs_FlightItem.__refkeys)
  
    const flight_sr_sf = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F14", airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id }), _specs_FlightItem.__refkeys)
    const flight_sr_ke = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q1", duration_hours: 5, flight_code: "F15", airplane: plane_tu144_reg333.id, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id }), _specs_FlightItem.__refkeys)
  
    const flight_ke_sf = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q2", duration_hours: 5, flight_code: "F16", airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id }), _specs_FlightItem.__refkeys)
    const flight_ke_mw = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q2", duration_hours: 4, flight_code: "F17", airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
    const flight_ke_mw1 = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q2", duration_hours: 5, flight_code: "F18", airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
  
    const flight_pt_mw = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q3", duration_hours: 5, flight_code: "F19", airplane: plane_tu144_reg333.id, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id }), _specs_FlightItem.__refkeys)
    const flight_pt_sf = await transactPutItem(new _specs_FlightItem({ tourist_season: "2021/Q3", duration_hours: 7, flight_code: "F20", airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }), _specs_FlightItem.__refkeys)
  
    // // many tourists
    // //flight_sf_mw
    for (let i = 0; i < 2; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sf_mw.id, airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }))
    }
    //flight_sf_bj
    for (let i = 0; i < 30; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sf_bj.id, airplane: plane_tu144_reg333.id, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id }))
    }
    //flight_sf_mw1
    for (let i = 0; i < 40; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sf_mw1.id, airplane: plane_tu144_reg222.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }))
    }
    //flight_bj_mw
    for (let i = 0; i < 50; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_bj_mw.id, airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id }))
    }
    //flight_bj_ke
    for (let i = 0; i < 10; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_bj_ke.id, airplane: plane_tu144_reg333.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }))
    }
    //flight_bj_ke1
    for (let i = 0; i < 15; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_bj_ke1.id, airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }))
    }
    //flight_bj_sy
    for (let i = 0; i < 20; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_bj_sy.id, airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id }))
    }
    //flight_mw_ke
    for (let i = 0; i < 40; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_mw_ke.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id }))
    }
    //flight_mw_sf
    for (let i = 0; i < 30; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_mw_sf.id, airplane: plane_tu144_reg222.id, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }))
    }
    //flight_mw_pt
    for (let i = 0; i < 20; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_mw_pt.id, airplane: plane_b787_reg555.id, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id }))
    }
    //flight_sy_bj
    for (let i = 0; i < 1; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sy_bj.id, airplane: plane_b787_reg444.id, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id }))
    }
    //flight_sy_ln
    for (let i = 0; i < 5; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sy_ln.id, airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id }))
    }
    //flight_sy_ke
    for (let i = 0; i < 9; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sy_ke.id, airplane: plane_tu144_reg333.id, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id }))
    }
    //flight_sr_sf
    for (let i = 0; i < 4; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sr_sf.id, airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id }))
    }
    //flight_sr_ke
    for (let i = 0; i < 7; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_sr_ke.id, airplane: plane_tu144_reg333.id, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id }))
    }
    //flight_ke_sf
    for (let i = 0; i < 11; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_ke_sf.id, airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id }))
    }
    //flight_ke_mw
    for (let i = 0; i < 66; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_ke_mw.id, airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }))
    }
    //flight_ke_mw1
    for (let i = 0; i < 2; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_ke_mw1.id, airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }))
    }
  
    //flight_pt_mw
    for (let i = 0; i < 10; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_pt_mw.id, airplane: plane_tu144_reg333.id, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id }))
    }
    //flight_pt_sf
    for (let i = 0; i < 20; i++) {
      await transactPutItem(new _specs_TouristItem({ flight: flight_pt_sf.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }))
    }

    return 469; // (test) count nr of items inserted
  }