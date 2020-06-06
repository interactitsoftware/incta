import { transactPutItem } from "../../dynamodb-transactPutItem"
import { TestModel_CountryItem, TestModel_AirportItem, TestModel_AirplaneModelItem, TestModel_AirplaneManifacturerItem, TestModel_AirplaneItem, TestModel_FlightItem, TestModel_TouristItem } from "../testmodel/_DynamoItems"



export const seedAirtoursData = async () => {
    // 7 countries
    const bg_country = await transactPutItem(new TestModel_CountryItem({ name: "Bulgaria" }))
    const sr_country = await transactPutItem(new TestModel_CountryItem({ name: "Serbia" }))
    const ru_country = await transactPutItem(new TestModel_CountryItem({ name: "Russia" }))
    const ch_country = await transactPutItem(new TestModel_CountryItem({ name: "China" }))
    const us_country = await transactPutItem(new TestModel_CountryItem({ name: "United States" }))
    const uk_country = await transactPutItem(new TestModel_CountryItem({ name: "United Kingdom" }))
    const au_country = await transactPutItem(new TestModel_CountryItem({ name: "Australia" }))
    // 10 airports
    const bg_airport_sf = await transactPutItem(new TestModel_AirportItem({ name: "Sofia", country: bg_country.id }), TestModel_AirportItem.__refkeys)
    const bg_airport_bs = await transactPutItem(new TestModel_AirportItem({ name: "Bourgas", country: bg_country.id }), TestModel_AirportItem.__refkeys)
    const sr_airport_bg = await transactPutItem(new TestModel_AirportItem({ name: "Belgrade", country: sr_country.id }), TestModel_AirportItem.__refkeys)
    const ch_airport_bj = await transactPutItem(new TestModel_AirportItem({ name: "Beijing", country: ch_country.id }), TestModel_AirportItem.__refkeys)
    const us_airport_ke = await transactPutItem(new TestModel_AirportItem({ name: "kenedi", country: us_country.id }), TestModel_AirportItem.__refkeys)
    const uk_airport_ln = await transactPutItem(new TestModel_AirportItem({ name: "London", country: uk_country.id }), TestModel_AirportItem.__refkeys)
    const au_airport_sy = await transactPutItem(new TestModel_AirportItem({ name: "Sydney", country: au_country.id }), TestModel_AirportItem.__refkeys)
    const ru_airport_mw = await transactPutItem(new TestModel_AirportItem({ name: "Moscow", country: ru_country.id }), TestModel_AirportItem.__refkeys)
    const ru_airport_pt = await transactPutItem(new TestModel_AirportItem({ name: "St. Petersburg", country: ru_country.id }), TestModel_AirportItem.__refkeys)
    const ru_airport_ng = await transactPutItem(new TestModel_AirportItem({ name: "Novgorod", country: ru_country.id }), TestModel_AirportItem.__refkeys)
    // 5 airplanes - by 2 different manifacurers, of 3 different models
    // the manifacturers
    const boeing = await transactPutItem(new TestModel_AirplaneManifacturerItem({ name: "Boeing", country: us_country.id }), TestModel_AirplaneManifacturerItem.__refkeys)
    const irkut = await transactPutItem(new TestModel_AirplaneManifacturerItem({ name: "Irkut", country: ru_country.id }), TestModel_AirplaneManifacturerItem.__refkeys)
    // the models
    const model_787 = await transactPutItem(new TestModel_AirplaneModelItem({ name: "Boeing 787", country: us_country.id, manifacurer: boeing.id }), TestModel_AirplaneModelItem.__refkeys)
    const model_mc21 = await transactPutItem(new TestModel_AirplaneModelItem({ name: "MC-21", country: ru_country.id, manifacurer: irkut.id }), TestModel_AirplaneModelItem.__refkeys)
    const model_tu144 = await transactPutItem(new TestModel_AirplaneModelItem({ name: "TU-144", country: ru_country.id, manifacurer: irkut.id }), TestModel_AirplaneModelItem.__refkeys)
    // the planes
    const plane_mc21_reg111 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg111", reg_uq_number: 111, country: ru_country.id, manifacurer: irkut.id, model: model_mc21.id }), TestModel_AirplaneItem.__refkeys)
    const plane_tu144_reg222 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg222", reg_uq_number: 222, country: ru_country.id, manifacurer: irkut.id, model: model_tu144.id }), TestModel_AirplaneItem.__refkeys)
    const plane_tu144_reg333 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg333", reg_uq_number: 333, country: ru_country.id, manifacurer: irkut.id, model: model_tu144.id }), TestModel_AirplaneItem.__refkeys)
    const plane_b787_reg444 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg444", reg_uq_number: 444, country: us_country.id, manifacurer: boeing.id, model: model_787.id }), TestModel_AirplaneItem.__refkeys)
    const plane_b787_reg555 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg555", reg_uq_number: 555, country: us_country.id, manifacurer: boeing.id, model: model_787.id }), TestModel_AirplaneItem.__refkeys)
  
    // 20 flights
    const flight_sf_mw = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
    const flight_sf_bj = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg333, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id }),TestModel_FlightItem.__refkeys)
    const flight_sf_mw1 = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg222, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
  
    const flight_bj_mw = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
    const flight_bj_ke = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg333, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }),TestModel_FlightItem.__refkeys)
    const flight_bj_ke1 = await transactPutItem(new TestModel_FlightItem({ airplane: plane_b787_reg444, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }),TestModel_FlightItem.__refkeys)
    const flight_bj_sy = await transactPutItem(new TestModel_FlightItem({ airplane: plane_b787_reg444, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id }),TestModel_FlightItem.__refkeys)
  
    const flight_mw_ke = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id }),TestModel_FlightItem.__refkeys)
    const flight_mw_sf = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg222, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }),TestModel_FlightItem.__refkeys)
    const flight_mw_pt = await transactPutItem(new TestModel_FlightItem({ airplane: plane_b787_reg555, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
  
    const flight_sy_bj = await transactPutItem(new TestModel_FlightItem({ airplane: plane_b787_reg444, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id }),TestModel_FlightItem.__refkeys)
    const flight_sy_ln = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id }),TestModel_FlightItem.__refkeys)
    const flight_sy_ke = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg333, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id }),TestModel_FlightItem.__refkeys)
  
    const flight_sr_sf = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id }),TestModel_FlightItem.__refkeys)
    const flight_sr_ke = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg333, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id }),TestModel_FlightItem.__refkeys)
  
    const flight_ke_sf = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg222, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id }),TestModel_FlightItem.__refkeys)
    const flight_ke_mw = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg222, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
    const flight_ke_mw1 = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
  
    const flight_pt_mw = await transactPutItem(new TestModel_FlightItem({ airplane: plane_tu144_reg333, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id }),TestModel_FlightItem.__refkeys)
    const flight_pt_sf = await transactPutItem(new TestModel_FlightItem({ airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }),TestModel_FlightItem.__refkeys)
  
    // // 100 tourists
    // //flight_sf_mw
    for (let i = 0; i < 2; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sf_mw.id, airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }))
    }
    //flight_sf_bj
    for (let i = 0; i < 30; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sf_bj.id, airplane: plane_tu144_reg333, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id }))
    }
    //flight_sf_mw1
    for (let i = 0; i < 40; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sf_mw1.id, airplane: plane_tu144_reg222, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }))
    }
    //flight_bj_mw
    for (let i = 0; i < 50; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_mw.id, airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id }))
    }
    //flight_bj_ke
    for (let i = 0; i < 10; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_ke.id, airplane: plane_tu144_reg333, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }))
    }
    //flight_bj_ke1
    for (let i = 0; i < 15; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_ke1.id, airplane: plane_b787_reg444, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }))
    }
    //flight_bj_sy
    for (let i = 0; i < 20; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_sy.id, airplane: plane_b787_reg444, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id }))
    }
    //flight_mw_ke
    for (let i = 0; i < 40; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_mw_ke.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id }))
    }
    //flight_mw_sf
    for (let i = 0; i < 30; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_mw_sf.id, airplane: plane_tu144_reg222, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }))
    }
    //flight_mw_pt
    for (let i = 0; i < 20; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_mw_pt.id, airplane: plane_b787_reg555, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id }))
    }
    //flight_sy_bj
    for (let i = 0; i < 1; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sy_bj.id, airplane: plane_b787_reg444, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id }))
    }
    //flight_sy_ln
    for (let i = 0; i < 5; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sy_ln.id, airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id }))
    }
    //flight_sy_ke
    for (let i = 0; i < 9; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sy_ke.id, airplane: plane_tu144_reg333, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id }))
    }
    //flight_sr_sf
    for (let i = 0; i < 4; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sr_sf.id, airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id }))
    }
    //flight_sr_ke
    for (let i = 0; i < 7; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_sr_ke.id, airplane: plane_tu144_reg333, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id }))
    }
    //flight_ke_sf
    for (let i = 0; i < 11; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_ke_sf.id, airplane: plane_tu144_reg222, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id }))
    }
    //flight_ke_mw
    for (let i = 0; i < 66; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_ke_mw.id, airplane: plane_tu144_reg222, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }))
    }
    //flight_ke_mw1
    for (let i = 0; i < 2; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_ke_mw1.id, airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }))
    }
  
    //flight_pt_mw
    for (let i = 0; i < 10; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_pt_mw.id, airplane: plane_tu144_reg333, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id }))
    }
    //flight_pt_sf
    for (let i = 0; i < 20; i++) {
      await transactPutItem(new TestModel_TouristItem({ flight: flight_pt_sf.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }))
    }
  }