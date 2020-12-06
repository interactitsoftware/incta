import { queryItems } from "aarts-ddb";
import { versionString } from "aarts-ddb";
import { seedAirtoursData } from "aarts-ddb/__specs__/testmodel/testDataSeeder";
import { _specs_AirplaneItem, _specs_AirportItem, _specs_FlightItem } from "aarts-ddb/__specs__/testmodel/_DynamoItems";
import { clearDynamo } from "aarts-ddb/__specs__/testutils";

describe('query', () => {

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
        pk: `${_specs_AirportItem.__type}}name`,
        range: "Sofia",
        ringToken: 'test-ring-token'
      })
      // META: flight}to_airport; 
      // SMETADATA: SOFIA AIRPORT's ID
      const all_flights_to_sofia = await queryItems({
        ddbIndex: "meta__smetadata",
        primaryKeyName: "meta",
        rangeKeyName: "smetadata",
        pk: `${_specs_FlightItem.__type}}to_airport`,
        range: sofia_airport.items && sofia_airport.items[0].id,
        ringToken: 'test-ring-token'
      })

      return expect(all_flights_to_sofia.items.length).toBe(4) // see test model below
    })
    test('query all items having particular string refkey value', async () => {
      // get all airplanes with number_of_seats > 20
      const high_volume_planes = await queryItems({
        ddbIndex: "meta__smetadata",
        pk: `${_specs_FlightItem.__type}}flight_code`,
        range: "F13",
        rangeKeyName: 'smetadata',
        primaryKeyName: 'meta',
        ringToken: 'test-ring-token'
      })

      return expect(high_volume_planes.items.length).toBe(1) //see testmodel
    })
  })


  describe('query.gsi2.meta__nmetadata.spec', () => {
    test('query all items having particular number refkey value', async () => {
      // get all airplanes with number_of_seats > 20
      const high_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${_specs_AirplaneItem.__type}}number_of_seats`,
        range: 15,
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta',
        ringToken: 'test-ring-token'
      })

      return expect(high_volume_planes.items.length).toBe(1) //see testmodel
    })
    test('query all items having particular refkey greater than number value', async () => {
      // get all airplanes with number_of_seats > 20
      const high_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${_specs_AirplaneItem.__type}}number_of_seats`,
        range: { min: 20, max: 999 },
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta',
        ringToken: 'test-ring-token'
      })

      return expect(high_volume_planes.items.length).toBe(3)

    })
    test('query all items having particular refkey lower than number value', async () => {
      // get all airplanes with number_of_seats < 20
      const low_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${_specs_AirplaneItem.__type}}number_of_seats`,
        range: { min: 0, max: 20 },
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta',
        ringToken: 'test-ring-token'
      })

      return expect(low_volume_planes.items.length).toBe(2)

    })
    test('query all items having particular refkey between 2 number values', async () => {
      // get all airplanes with 10 < number_of_seats < 25
      const low_volume_planes = await queryItems({
        ddbIndex: "meta__nmetadata",
        pk: `${_specs_AirplaneItem.__type}}number_of_seats`,
        range: { min: 10, max: 25 },
        rangeKeyName: 'nmetadata',
        primaryKeyName: 'meta',
        ringToken: 'test-ring-token'
      })

      return expect(low_volume_planes.items.length).toBe(3)

    })
  })

  test('meta__smetadata: query particular item types having something in common with a string refkey value', async () => {
    // get the sofia airport dynamo record
    const sofia_airport = await queryItems({
      ddbIndex: "meta__smetadata",
      primaryKeyName: "meta",
      rangeKeyName: "smetadata",
      pk: `${_specs_AirportItem.__type}}name`,
      range: "Sofia",
      ringToken: 'test-ring-token'
    })

    // get all flights to or from sofia
    // PK: Sofia
    // RANGE: begins_with(flight); 
    const all_flights_to_from_sofia = await queryItems({
      ddbIndex: "smetadata__meta",
      primaryKeyName: "smetadata",
      rangeKeyName: "meta",
      pk: `${sofia_airport.items && sofia_airport.items[0].id}`,
      range: `${_specs_FlightItem.__type}`,
      ringToken: 'test-ring-token'
    })
    return expect(all_flights_to_from_sofia.items.length).toBe(7) //see test model
  })

  test('nmetadata__meta: query particular item types having something in common with a number refkey value', async () => {

    const airplane_with_unique_ref_555 = await queryItems({
      ddbIndex: "nmetadata__meta",
      primaryKeyName: "nmetadata",
      rangeKeyName: "meta",
      pk: 555,
      ringToken: 'test-ring-token'
    })

    expect(airplane_with_unique_ref_555.items.length).toBe(1)
    expect(airplane_with_unique_ref_555.items && airplane_with_unique_ref_555.items[0].__typename).toBe(`${_specs_AirplaneItem.__type}`)

    const all_items_relating_to_airplane_555 = await queryItems({
      ddbIndex: "smetadata__meta",
      primaryKeyName: "smetadata",
      rangeKeyName: "meta",
      pk: (airplane_with_unique_ref_555.items && airplane_with_unique_ref_555.items[0].id) as string,
      ringToken: 'test-ring-token'
    })

    expect(all_items_relating_to_airplane_555.items.length).toBe(1) // so airplane 555 flew only once, see test model 

    const airplane_with_unique_ref_111 = await queryItems({
      ddbIndex: "nmetadata__meta",
      primaryKeyName: "nmetadata",
      rangeKeyName: "meta",
      pk: 111,
      ringToken: 'test-ring-token'
    })

    expect(airplane_with_unique_ref_111.items.length).toBe(1)
    expect(airplane_with_unique_ref_111.items && airplane_with_unique_ref_111.items[0].__typename).toBe(`${_specs_AirplaneItem.__type}`)

    const all_items_relating_to_airplane_444 = await queryItems({
      ddbIndex: "smetadata__meta",
      primaryKeyName: "smetadata",
      rangeKeyName: "meta",
      pk: (airplane_with_unique_ref_111.items && airplane_with_unique_ref_111.items[0].id) as string,
      ringToken: 'test-ring-token'
    })

    expect(all_items_relating_to_airplane_444.items.length).toBe(7) // so airplane 111 had 7 flights 
  })
})