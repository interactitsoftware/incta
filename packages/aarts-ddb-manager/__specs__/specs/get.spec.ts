
import { batchGetItem } from "aarts-ddb";
import { transactPutItem } from "aarts-ddb";
import { AirplaneItem, AirportItem } from "../testmodel/_DynamoItems";
import { clearDynamo } from "aarts-ddb/__specs__/testutils";

describe('get', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  // afterAll(async (done) => { await clearDynamo(); done() })

  test('get items by PK', async () => {

    const airplane = Object.assign(new AirplaneItem(), {number_of_seats: 11 })
    const airplane1 = Object.assign(new AirplaneItem(),{number_of_seats: 12 })
    const airplane2 = Object.assign(new AirplaneItem(), {number_of_seats: 13 })
    const airport = Object.assign(new AirportItem(), {airport_size:200})
    const airport2 = Object.assign(new AirportItem(), {airport_size: 300 })
    
    await transactPutItem(airplane, AirplaneItem.__refkeys)
    await transactPutItem(airplane1, AirplaneItem.__refkeys)
    await transactPutItem(airplane2, AirplaneItem.__refkeys)
    await transactPutItem(airport, AirportItem.__refkeys)
    await transactPutItem(airport2, AirportItem.__refkeys)

    const getResult = await batchGetItem({
      loadPeersLevel: 0,
      pks: [
        {id:airplane.id, meta: airplane.meta},
        {id:airplane2.id, meta: airplane2.meta},
        {id:airport.id, meta: airport.meta},
        {id:airport2.id, meta: airport2.meta},
        {id:"some not existing", meta: "some not existing"}
      ], 
      ringToken: 'test-ring-token'
    })

    expect(getResult.items.length).toBe(4)
    expect(getResult.items.filter(r=>r.__typename === AirplaneItem.__type).filter(r => r.number_of_seats === 11).length).toBe(1)
    expect(getResult.items.filter(r=>r.__typename === AirplaneItem.__type).filter(r => r.number_of_seats === 13).length).toBe(1)
    expect(getResult.items.filter(r=>r.__typename === AirportItem.__type).filter(r => r.airport_size === 200).length).toBe(1)
    expect(getResult.items.filter(r=>r.__typename === AirportItem.__type).filter(r => r.airport_size === 300).length).toBe(1)
    
  })
})


