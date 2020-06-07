import { Strippable, clearDynamo, queryForId } from "../../testutils"
import { transactPutItem } from "../../../dynamodb-transactPutItem";
import { TestModel_CountryItem, TestModel_AirportItem, TestModel_AirplaneManifacturerItem, TestModel_AirplaneModelItem, TestModel_AirplaneItem, TestModel_FlightItem, TestModel_TouristItem } from "../../testmodel/_DynamoItems";
import { queryItems } from "../../../dynamodb-queryItems";
import { versionString } from "../../../DynamoDbClient";

describe('query spec', () => {

  beforeAll(async (done) => {
    await clearDynamo();
    await seedAirtoursData()
    done()
  }, 60000)
  // afterAll(async (done) => { await clearDynamo(); done() })

  describe('query.gsi1.meta__smetadata.spec', () => {
    // get all flights to sofia
    test('query all items having particular string refkey value', async () => {

      // get the sofia airport dynamo record
      const sofia_airport = await queryItems({
        ddbIndex: "meta__smetadata",
        primaryKeyName: "meta",
        rangeKeyName: "smetadata",
        pk: `${TestModel_AirportItem.__type}}name`,
        range: "Sofia"
      })
      // META: flight}to_airport; 
      // SMETADATA: SOFIA AIRPORT's ID
      const all_flights_to_sofia = await queryItems({
        ddbIndex: "meta__smetadata",
        primaryKeyName: "meta",
        rangeKeyName: "smetadata",
        pk: `${TestModel_FlightItem.__type}}to_airport`,
        range: sofia_airport.items && sofia_airport.items[0].id
      })

      return expect(all_flights_to_sofia.count).toBe(4) // see test model below
    })
    test('query all items having particular string refkey value', async () => {
      // get all airplanes with number_of_seats > 20
      const high_volume_planes = await queryItems({
        ddbIndex: "meta__smetadata",
        pk: `${TestModel_FlightItem.__type}}flight_code`,
        range: "F13",
        rangeKeyName: 'smetadata',
        primaryKeyName: 'meta'
      })

      return expect(high_volume_planes.count).toBe(1) //see testmodel
    })
  })


  describe('query.gsi2.meta__nmetadata.spec', () => {
    test('query all items having particular number refkey value', async () => {
      // get all airplanes with number_of_seats > 20
      const high_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
        range: 15,
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta'
      })

      return expect(high_volume_planes.count).toBe(1) //see testmodel
    })
    test('query all items having particular refkey greater than number value', async () => {
      // get all airplanes with number_of_seats > 20
      const high_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
        range: { min: 20, max: 999 },
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta'
      })

      return expect(high_volume_planes.count).toBe(3)

    })
    test('query all items having particular refkey lower than number value', async () => {
      // get all airplanes with number_of_seats < 20
      const low_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
        range: { min: 0, max: 20 },
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta'
      })

      return expect(low_volume_planes.count).toBe(2)

    })
    test('query all items having particular refkey between 2 number values', async () => {
      // get all airplanes with 10 < number_of_seats < 25
      const low_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
        range: { min: 10, max: 25 },
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta'
      })

      return expect(low_volume_planes.count).toBe(3)

    })
  })

  describe('query.gsi3.smetadata__meta.spec', () => {
    test('query particular item types having something in common with a string refkey value', async () => {
      // get the sofia airport dynamo record
      const sofia_airport = await queryItems({
        ddbIndex: "meta__smetadata",
        primaryKeyName: "meta",
        rangeKeyName: "smetadata",
        pk: `${TestModel_AirportItem.__type}}name`,
        range: "Sofia"
      })

      // get all flights to or from sofia
      // PK: Sofia
      // RANGE: begins_with(flight); 
      const all_flights_to_from_sofia = await queryItems({
        ddbIndex: "smetadata__meta",
        primaryKeyName: "smetadata",
        rangeKeyName: "meta",
        pk: `${sofia_airport.items && sofia_airport.items[0].id}`,
        range: "flight"
      })
      return expect(all_flights_to_from_sofia.count).toBe(7) //see test model
    })
  })

  describe('query.gsi4.nmetadata__meta.spec', () => {
    test('query particular item types having something in common with a number refkey value', async () => {
      
      const airplane_with_unique_ref_555 = await queryItems({
        ddbIndex: "nmetadata__meta",
        primaryKeyName: "nmetadata",
        rangeKeyName: "meta",
        pk: 555
      })

      expect(airplane_with_unique_ref_555.count).toBe(1)
      expect(airplane_with_unique_ref_555.items && airplane_with_unique_ref_555.items[0].item_type).toBe("airplane")

      const all_items_relating_to_airplane_555 = await queryItems({
        ddbIndex: "smetadata__meta",
        primaryKeyName: "smetadata",
        rangeKeyName: "meta",
        pk: airplane_with_unique_ref_555.items && airplane_with_unique_ref_555.items[0].id
      })

      expect(all_items_relating_to_airplane_555.count).toBe(0) // so airplane 555 never flew, see test model 

      const airplane_with_unique_ref_111 = await queryItems({
        ddbIndex: "nmetadata__meta",
        primaryKeyName: "nmetadata",
        rangeKeyName: "meta",
        pk: 111
      })

      expect(airplane_with_unique_ref_111.count).toBe(1)
      expect(airplane_with_unique_ref_111.items && airplane_with_unique_ref_111.items[0].item_type).toBe("airplane")

      const all_items_relating_to_airplane_444 = await queryItems({
        ddbIndex: "smetadata__meta",
        primaryKeyName: "smetadata",
        rangeKeyName: "meta",
        pk: airplane_with_unique_ref_111.items && airplane_with_unique_ref_111.items[0].id
      })

      expect(all_items_relating_to_airplane_444.count).toBe(7) // so airplane 111 had 7 flights 
      

    })

  })

  describe('use additional filter on keys', () => {
    test('query all flights with duration greater than 10 hours', async () => {
      const long_lasting_flights = await queryItems({
        ddbIndex: "meta__id",
        primaryKeyName: "meta",
        pk: `${versionString(0)}|${TestModel_FlightItem.__type}`,
        rangeKeyName: "id",
        filter: [{ key: "duration_hours", predicate: ">", value: 10 }]
      })
      return expect(long_lasting_flights.count).toBe(9)
    })
    test('query all flights with duration greater than or equal 10 hours', async () => {
      const long_lasting_flights = await queryItems({
        ddbIndex: "meta__id",
        primaryKeyName: "meta",
        pk: `${versionString(0)}|${TestModel_FlightItem.__type}`,
        rangeKeyName: "id",
        filter: [{ key: "duration_hours", predicate: ">=", value: 10 }]
      })
      return expect(long_lasting_flights.count).toBe(10)
    })
  })

})



export const seedAirtoursData = async () => {
  // 7 countries
  const bg_country = await transactPutItem(new TestModel_CountryItem({ name: "Bulgaria" }), TestModel_CountryItem.__refkeys)
  const sr_country = await transactPutItem(new TestModel_CountryItem({ name: "Serbia" }), TestModel_CountryItem.__refkeys)
  const ru_country = await transactPutItem(new TestModel_CountryItem({ name: "Russia" }), TestModel_CountryItem.__refkeys)
  const ch_country = await transactPutItem(new TestModel_CountryItem({ name: "China" }), TestModel_CountryItem.__refkeys)
  const us_country = await transactPutItem(new TestModel_CountryItem({ name: "United States" }), TestModel_CountryItem.__refkeys)
  const uk_country = await transactPutItem(new TestModel_CountryItem({ name: "United Kingdom" }), TestModel_CountryItem.__refkeys)
  const au_country = await transactPutItem(new TestModel_CountryItem({ name: "Australia" }), TestModel_CountryItem.__refkeys)
  // 10 airports
  const bg_airport_sf = await transactPutItem(new TestModel_AirportItem({ name: "Sofia", country: bg_country.id }), TestModel_AirportItem.__refkeys)
  const bg_airport_bs = await transactPutItem(new TestModel_AirportItem({ name: "Bourgas", country: bg_country.id }), TestModel_AirportItem.__refkeys)
  const sr_airport_bg = await transactPutItem(new TestModel_AirportItem({ name: "Belgrade", country: sr_country.id }), TestModel_AirportItem.__refkeys)
  const ch_airport_bj = await transactPutItem(new TestModel_AirportItem({ name: "Beijing", country: ch_country.id }), TestModel_AirportItem.__refkeys)
  const us_airport_ke = await transactPutItem(new TestModel_AirportItem({ name: "Kenedi", country: us_country.id }), TestModel_AirportItem.__refkeys)
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
  const plane_mc21_reg111 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 10, reg_uq_str: "reg111", reg_uq_number: 111, country: ru_country.id, manifacurer: irkut.id, model: model_mc21.id }), TestModel_AirplaneItem.__refkeys)
  const plane_tu144_reg222 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 25, reg_uq_str: "reg222", reg_uq_number: 222, country: ru_country.id, manifacurer: irkut.id, model: model_tu144.id }), TestModel_AirplaneItem.__refkeys)
  const plane_tu144_reg333 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 15, reg_uq_str: "reg333", reg_uq_number: 333, country: ru_country.id, manifacurer: irkut.id, model: model_tu144.id }), TestModel_AirplaneItem.__refkeys)
  const plane_b787_reg444 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 50, reg_uq_str: "reg444", reg_uq_number: 444, country: us_country.id, manifacurer: boeing.id, model: model_787.id }), TestModel_AirplaneItem.__refkeys)
  const plane_b787_reg555 = await transactPutItem(new TestModel_AirplaneItem({ number_of_seats: 100, reg_uq_str: "reg555", reg_uq_number: 555, country: us_country.id, manifacurer: boeing.id, model: model_787.id }), TestModel_AirplaneItem.__refkeys)

  // 20 flights
  const flight_sf_mw = await transactPutItem(new TestModel_FlightItem({ duration_hours: 10, flight_code: "F1", airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)
  const flight_sf_bj = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F2", airplane: plane_tu144_reg333, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id }), TestModel_FlightItem.__refkeys)
  const flight_sf_mw1 = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F3", airplane: plane_tu144_reg222, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)

  const flight_bj_mw = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F4", airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)
  const flight_bj_ke = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F5", airplane: plane_tu144_reg333, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }), TestModel_FlightItem.__refkeys)
  const flight_bj_ke1 = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F6", irplane: plane_b787_reg444, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }), TestModel_FlightItem.__refkeys)
  const flight_bj_sy = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F7", airplane: plane_b787_reg444, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id }), TestModel_FlightItem.__refkeys)

  const flight_mw_ke = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F8", airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id }), TestModel_FlightItem.__refkeys)
  const flight_mw_sf = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F9", airplane: plane_tu144_reg222, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }), TestModel_FlightItem.__refkeys)
  const flight_mw_pt = await transactPutItem(new TestModel_FlightItem({ duration_hours: 15, flight_code: "F10", airplane: plane_b787_reg555, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)

  const flight_sy_bj = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F11", airplane: plane_b787_reg444, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id }), TestModel_FlightItem.__refkeys)
  const flight_sy_ln = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F12", airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id }), TestModel_FlightItem.__refkeys)
  const flight_sy_ke = await transactPutItem(new TestModel_FlightItem({ duration_hours: 2, flight_code: "F13", airplane: plane_tu144_reg333, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id }), TestModel_FlightItem.__refkeys)

  const flight_sr_sf = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F14", airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id }), TestModel_FlightItem.__refkeys)
  const flight_sr_ke = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F15", airplane: plane_tu144_reg333, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id }), TestModel_FlightItem.__refkeys)

  const flight_ke_sf = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F16", airplane: plane_tu144_reg222, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id }), TestModel_FlightItem.__refkeys)
  const flight_ke_mw = await transactPutItem(new TestModel_FlightItem({ duration_hours: 4, flight_code: "F17", airplane: plane_tu144_reg222, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)
  const flight_ke_mw1 = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F18", airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)

  const flight_pt_mw = await transactPutItem(new TestModel_FlightItem({ duration_hours: 5, flight_code: "F19", airplane: plane_tu144_reg333, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id }), TestModel_FlightItem.__refkeys)
  const flight_pt_sf = await transactPutItem(new TestModel_FlightItem({ duration_hours: 7, flight_code: "F20", airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }), TestModel_FlightItem.__refkeys)

  // // 100 tourists
  // //flight_sf_mw
  for (let i = 0; i < 2; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sf_mw.id, airplane: plane_mc21_reg111.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }))
  }
  //flight_sf_bj
  for (let i = 0; i < 30; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sf_bj.id, airplane: plane_tu144_reg333.id, from_airport: bg_airport_sf.id, to_airport: ch_airport_bj.id, from_country: bg_country.id, to_country: ch_country.id }))
  }
  //flight_sf_mw1
  for (let i = 0; i < 40; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sf_mw1.id, airplane: plane_tu144_reg222.id, from_airport: bg_airport_sf.id, to_airport: ru_airport_mw.id, from_country: bg_country.id, to_country: ru_country.id }))
  }
  //flight_bj_mw
  for (let i = 0; i < 50; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_mw.id, airplane: plane_mc21_reg111.id, from_airport: ch_airport_bj.id, to_airport: ru_airport_mw.id, from_country: ch_country.id, to_country: ru_country.id }))
  }
  //flight_bj_ke
  for (let i = 0; i < 10; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_ke.id, airplane: plane_tu144_reg333.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }))
  }
  //flight_bj_ke1
  for (let i = 0; i < 15; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_ke1.id, airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: us_airport_ke.id, from_country: ch_country.id, to_country: us_country.id }))
  }
  //flight_bj_sy
  for (let i = 0; i < 20; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_bj_sy.id, airplane: plane_b787_reg444.id, from_airport: ch_airport_bj.id, to_airport: au_airport_sy.id, from_country: ch_country.id, to_country: au_country.id }))
  }
  //flight_mw_ke
  for (let i = 0; i < 40; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_mw_ke.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_mw.id, to_airport: us_airport_ke.id, from_country: ru_country.id, to_country: us_country.id }))
  }
  //flight_mw_sf
  for (let i = 0; i < 30; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_mw_sf.id, airplane: plane_tu144_reg222.id, from_airport: ru_airport_mw.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }))
  }
  //flight_mw_pt
  for (let i = 0; i < 20; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_mw_pt.id, airplane: plane_b787_reg555.id, from_airport: ru_airport_mw.id, to_airport: ru_airport_pt.id, from_country: ru_country.id, to_country: ru_country.id }))
  }
  //flight_sy_bj
  for (let i = 0; i < 1; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sy_bj.id, airplane: plane_b787_reg444.id, from_airport: au_airport_sy.id, to_airport: ch_airport_bj.id, from_country: au_country.id, to_country: ch_country.id }))
  }
  //flight_sy_ln
  for (let i = 0; i < 5; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sy_ln.id, airplane: plane_mc21_reg111.id, from_airport: au_airport_sy.id, to_airport: uk_airport_ln.id, from_country: au_country.id, to_country: uk_country.id }))
  }
  //flight_sy_ke
  for (let i = 0; i < 9; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sy_ke.id, airplane: plane_tu144_reg333.id, from_airport: au_airport_sy.id, to_airport: us_airport_ke.id, from_country: au_country.id, to_country: us_country.id }))
  }
  //flight_sr_sf
  for (let i = 0; i < 4; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sr_sf.id, airplane: plane_mc21_reg111.id, from_airport: sr_airport_bg.id, to_airport: bg_airport_sf.id, from_country: sr_country.id, to_country: bg_country.id }))
  }
  //flight_sr_ke
  for (let i = 0; i < 7; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_sr_ke.id, airplane: plane_tu144_reg333.id, from_airport: sr_airport_bg.id, to_airport: us_airport_ke.id, from_country: sr_country.id, to_country: us_country.id }))
  }
  //flight_ke_sf
  for (let i = 0; i < 11; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_ke_sf.id, airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: bg_airport_sf.id, from_country: us_country.id, to_country: bg_country.id }))
  }
  //flight_ke_mw
  for (let i = 0; i < 66; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_ke_mw.id, airplane: plane_tu144_reg222.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }))
  }
  //flight_ke_mw1
  for (let i = 0; i < 2; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_ke_mw1.id, airplane: plane_mc21_reg111.id, from_airport: us_airport_ke.id, to_airport: ru_airport_mw.id, from_country: us_country.id, to_country: ru_country.id }))
  }

  //flight_pt_mw
  for (let i = 0; i < 10; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_pt_mw.id, airplane: plane_tu144_reg333.id, from_airport: ru_airport_pt.id, to_airport: ru_airport_mw.id, from_country: ru_country.id, to_country: ru_country.id }))
  }
  //flight_pt_sf
  for (let i = 0; i < 20; i++) {
    await transactPutItem(new TestModel_TouristItem({ flight: flight_pt_sf.id, airplane: plane_mc21_reg111.id, from_airport: ru_airport_pt.id, to_airport: bg_airport_sf.id, from_country: ru_country.id, to_country: bg_country.id }))
  }
}