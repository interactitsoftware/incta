import { clearDynamo } from "../testutils"
import { AirplaneItem, AirportItem, CreateTouristsProperlyItem, FlightItem, TouristItem } from "../../../__bootstrap/_DynamoItems"
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { domainAdapter } from "../../../__bootstrap"
import { uuid, versionString } from "aarts-utils"
import { queryItems, transactPutItem } from "aarts-dynamodb"


describe('CreateTouristsProperly', () => {
  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('CreateTouristsProperly', async () => {

    const manager = domainAdapter.itemManagers[CreateTouristsProperlyItem.__type] as BaseDynamoItemManager<CreateTouristsProperlyItem>

    // arrange airports
    const sofiaAirport = await transactPutItem(new AirportItem({name:"Sofia airport"}), AirportItem.__refkeys) 
    const airportToBeLocatedById = await transactPutItem(new AirportItem({name:"Novgorod airport"}), AirportItem.__refkeys) 
    const flight = await transactPutItem(new FlightItem({flight_code:"abc-flight"}), FlightItem.__refkeys) 
    const airplane = await transactPutItem(new AirplaneItem({reg_uq_str:"abc-airplane"}), AirplaneItem.__refkeys) 

    for await (let res of await manager.start(CreateTouristsProperlyItem.__type, {
      meta: { action: "start", eventSource: "worker:input", item: TouristItem.__type, ringToken: uuid() },
      payload: {
        arguments: [{
          "touristsToCreate": 10,
          "useNamesLength": 1,
          "toAirport": "Sofia airport",
          "fromAirport": airportToBeLocatedById.id, // also will work, it will take it by name: "Novgorod airport",
          "toCountry": "Bulgaria",
          "fromCountry": "Russia",
          "airplane": "abc-airplane",
          "flight": "abc-flight"
        }],
        identity: {
          username: "testuser"
        }
      }
    })) { }

    const touristCreatedDbResult = await queryItems({
      ddbIndex: "meta__id",
      primaryKeyName: "meta",
      rangeKeyName: "id",
      pk: `${versionString(0)}|${TouristItem.__type}`
    })

    const touristCreated = touristCreatedDbResult.items && touristCreatedDbResult.items[0] as TouristItem

    expect(touristCreated?.from_airport).toBe(airportToBeLocatedById.id)
    expect(touristCreated?.to_airport).toBe(sofiaAirport.id)
    // those two even present in payload, werent found as refkeys (we didnt arrange them), thus were removed
    expect(touristCreated?.from_country).toBeUndefined()
    expect(touristCreated?.to_country).toBeUndefined()
    expect(touristCreated?.flight).toBe(flight.id)
    expect(touristCreated?.airplane).toBe(airplane.id)

  })
})
