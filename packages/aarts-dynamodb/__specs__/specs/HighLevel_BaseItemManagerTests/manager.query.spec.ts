import { Strippable, clearDynamo, queryForId } from "../../testutils"
import { transactPutItem } from "../../../dynamodb-transactPutItem";
import { TestModel_CountryItem, TestModel_AirportItem, TestModel_AirplaneManifacturerItem, TestModel_AirplaneModelItem, TestModel_AirplaneItem, TestModel_FlightItem, TestModel_TouristItem } from "../../testmodel/_DynamoItems";
import { queryItems } from "../../../dynamodb-queryItems";
import { versionString } from "../../../DynamoDbClient";
import { seedAirtoursData } from "../../testmodel/testDataSeeder";
import { domainAdapter } from "../../testmodel/itemManagersMap";

describe('query spec', () => {

    beforeAll(async (done) => {
        await clearDynamo();
        await seedAirtoursData()
        done()
    }, 60000)
    // afterAll(async (done) => { await clearDynamo(); done() })

    describe('query.gsi1.meta__smetadata.spec', () => {

        test('fill fail if arguments is not an array', async () => {

            // get the sofia airport dynamo record
            const queryGen = await domainAdapter.itemManagers[TestModel_AirportItem.__type].query(
                TestModel_AirportItem.__type,
                {
                    arguments: {

                    },
                    identity: "akrsmv"
                }
            )
            const willFailBecauseArgsNoArray = async () => {
                let queryProcessor = await queryGen.next()
                do {
                    if (!queryProcessor.done) {
                        queryProcessor = await queryGen.next()
                    }
                } while (!queryProcessor.done)
            }

            expect(willFailBecauseArgsNoArray).rejects.toThrow(/Query args is not an array!/)
        })

        // get all flights to sofia
        test('query all items having particular string refkey value', async () => {

            // get the sofia airport dynamo record
            const queryGen = await domainAdapter.itemManagers[TestModel_AirportItem.__type].query(
                TestModel_AirportItem.__type,
                {
                    arguments: [{
                        ddbIndex: "meta__smetadata",
                        primaryKeyName: "meta",
                        rangeKeyName: "smetadata",
                        pk: `${TestModel_AirportItem.__type}}name`,
                        range: "Sofia"
                    }],
                    identity: "akrsmv"
                }
            )

            let queryProcessor = await queryGen.next()
            do {
                if (!queryProcessor.done) {
                    queryProcessor = await queryGen.next()
                }
            } while (!queryProcessor.done)

            // META: flight}to_airport; 
            // SMETADATA: SOFIA AIRPORT's ID
            const queryGen1 = await domainAdapter.itemManagers[TestModel_AirportItem.__type].query(
                TestModel_AirportItem.__type,
                {
                    arguments: [{
                        ddbIndex: "meta__smetadata",
                        primaryKeyName: "meta",
                        rangeKeyName: "smetadata",
                        pk: `${TestModel_FlightItem.__type}}to_airport`,
                        range: queryProcessor.value.arguments.items && queryProcessor.value.arguments.items[0].id
                    }],
                    identity: "akrsmv"
                }
            )

            let queryProcessor1 = await queryGen1.next()
            do {
                if (!queryProcessor1.done) {
                    queryProcessor1 = await queryGen1.next()
                }
            } while (!queryProcessor1.done)


            return expect(queryProcessor1.value.arguments.count).toBe(4) // see test model below
        })

        // test('query all items having particular string refkey value', async () => {
        //     // get all airplanes with number_of_seats > 20
        //     const high_volume_planes = await queryItems({
        //         ddbIndex: "meta__smetadata",
        //         pk: `${TestModel_FlightItem.__type}}flight_code`,
        //         range: "F13",
        //         rangeKeyName: 'smetadata',
        //         primaryKeyName: 'meta'
        //     })

        //     return expect(high_volume_planes.count).toBe(1) //see testmodel
        // })
    })


    // describe('query.gsi2.meta__nmetadata.spec', () => {
    //     test('query all items having particular number refkey value', async () => {
    //         // get all airplanes with number_of_seats > 20
    //         const high_volume_planes = await queryItems({
    //             ddbIndex: "meta__nmetadata",
    //             pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
    //             range: 15,
    //             rangeKeyName: 'nmetadata',
    //             primaryKeyName: 'meta'
    //         })

    //         return expect(high_volume_planes.count).toBe(1) //see testmodel
    //     })
    //     test('query all items having particular refkey greater than number value', async () => {
    //         // get all airplanes with number_of_seats > 20
    //         const high_volume_planes = await queryItems({
    //             ddbIndex: "meta__nmetadata",
    //             pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
    //             range: { min: 20, max: 999 },
    //             rangeKeyName: 'nmetadata',
    //             primaryKeyName: 'meta'
    //         })

    //         return expect(high_volume_planes.count).toBe(3)

    //     })
    //     test('query all items having particular refkey lower than number value', async () => {
    //         // get all airplanes with number_of_seats < 20
    //         const low_volume_planes = await queryItems({
    //             ddbIndex: "meta__nmetadata",
    //             pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
    //             range: { min: 0, max: 20 },
    //             rangeKeyName: 'nmetadata',
    //             primaryKeyName: 'meta'
    //         })

    //         return expect(low_volume_planes.count).toBe(2)

    //     })
    //     test('query all items having particular refkey between 2 number values', async () => {
    //         // get all airplanes with 10 < number_of_seats < 25
    //         const low_volume_planes = await queryItems({
    //             ddbIndex: "meta__nmetadata",
    //             pk: `${TestModel_AirplaneItem.__type}}number_of_seats`,
    //             range: { min: 10, max: 25 },
    //             rangeKeyName: 'nmetadata',
    //             primaryKeyName: 'meta'
    //         })

    //         return expect(low_volume_planes.count).toBe(3)

    //     })
    // })

    // describe('query.gsi3.smetadata__meta.spec', () => {
    //     test('query particular item types having something in common with a string refkey value', async () => {
    //         // get the sofia airport dynamo record
    //         const sofia_airport = await queryItems({
    //             ddbIndex: "meta__smetadata",
    //             primaryKeyName: "meta",
    //             rangeKeyName: "smetadata",
    //             pk: `${TestModel_AirportItem.__type}}name`,
    //             range: "Sofia"
    //         })

    //         // get all flights to or from sofia
    //         // PK: Sofia
    //         // RANGE: begins_with(flight); 
    //         const all_flights_to_from_sofia = await queryItems({
    //             ddbIndex: "smetadata__meta",
    //             primaryKeyName: "smetadata",
    //             rangeKeyName: "meta",
    //             pk: `${sofia_airport.items && sofia_airport.items[0].id}`,
    //             range: "flight"
    //         })
    //         return expect(all_flights_to_from_sofia.count).toBe(7) //see test model
    //     })
    // })

    // describe('query.gsi4.nmetadata__meta.spec', () => {
    //     test('query particular item types having something in common with a number refkey value', async () => {

    //         const airplane_with_unique_ref_555 = await queryItems({
    //             ddbIndex: "nmetadata__meta",
    //             primaryKeyName: "nmetadata",
    //             rangeKeyName: "meta",
    //             pk: 555
    //         })

    //         expect(airplane_with_unique_ref_555.count).toBe(1)
    //         expect(airplane_with_unique_ref_555.items && airplane_with_unique_ref_555.items[0].item_type).toBe("airplane")

    //         const all_items_relating_to_airplane_555 = await queryItems({
    //             ddbIndex: "smetadata__meta",
    //             primaryKeyName: "smetadata",
    //             rangeKeyName: "meta",
    //             pk: airplane_with_unique_ref_555.items && airplane_with_unique_ref_555.items[0].id
    //         })

    //         expect(all_items_relating_to_airplane_555.count).toBe(0) // so airplane 555 never flew, see test model 

    //         const airplane_with_unique_ref_111 = await queryItems({
    //             ddbIndex: "nmetadata__meta",
    //             primaryKeyName: "nmetadata",
    //             rangeKeyName: "meta",
    //             pk: 111
    //         })

    //         expect(airplane_with_unique_ref_111.count).toBe(1)
    //         expect(airplane_with_unique_ref_111.items && airplane_with_unique_ref_111.items[0].item_type).toBe("airplane")

    //         const all_items_relating_to_airplane_444 = await queryItems({
    //             ddbIndex: "smetadata__meta",
    //             primaryKeyName: "smetadata",
    //             rangeKeyName: "meta",
    //             pk: airplane_with_unique_ref_111.items && airplane_with_unique_ref_111.items[0].id
    //         })

    //         expect(all_items_relating_to_airplane_444.count).toBe(7) // so airplane 111 had 7 flights 


    //     })

    // })

    // describe('use additional filter on keys', () => {
    //     test('query all flights with duration greater than 10 hours', async () => {
    //         const long_lasting_flights = await queryItems({
    //             ddbIndex: "meta__id",
    //             primaryKeyName: "meta",
    //             pk: `${versionString(0)}|${TestModel_FlightItem.__type}`,
    //             rangeKeyName: "id",
    //             filter: [{ key: "duration_hours", predicate: ">", value: 10 }]
    //         })
    //         return expect(long_lasting_flights.count).toBe(9)
    //     })
    //     test('query all flights with duration greater than or equal 10 hours', async () => {
    //         const long_lasting_flights = await queryItems({
    //             ddbIndex: "meta__id",
    //             primaryKeyName: "meta",
    //             pk: `${versionString(0)}|${TestModel_FlightItem.__type}`,
    //             rangeKeyName: "id",
    //             filter: [{ key: "duration_hours", predicate: ">=", value: 10 }]
    //         })
    //         return expect(long_lasting_flights.count).toBe(10)
    //     })
    // })

})
