
import { batchGetItem } from "../../dynamodb-batchGetItem";
import { transactPutItem } from "../../dynamodb-transactPutItem";
import { _specs_AirplaneItem, _specs_AirportItem } from "../testmodel/_DynamoItems";
import { clearDynamo } from "../testutils";

describe('get', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  // afterAll(async (done) => { await clearDynamo(); done() })

  test('get items by PK', async () => {

    const airplane = Object.assign(new _specs_AirplaneItem(), {number_of_seats: 11 })
    const airplane1 = Object.assign(new _specs_AirplaneItem(),{number_of_seats: 12 })
    const airplane2 = Object.assign(new _specs_AirplaneItem(), {number_of_seats: 13 })
    const airport = Object.assign(new _specs_AirportItem(), {airport_size:200})
    const airport2 = Object.assign(new _specs_AirportItem(), {airport_size: 300 })
    
    await transactPutItem(airplane, _specs_AirplaneItem.__refkeys)
    await transactPutItem(airplane1, _specs_AirplaneItem.__refkeys)
    await transactPutItem(airplane2, _specs_AirplaneItem.__refkeys)
    await transactPutItem(airport, _specs_AirportItem.__refkeys)
    await transactPutItem(airport2, _specs_AirportItem.__refkeys)

    const getResult = await batchGetItem({
      loadPeersLevel: 0,
      pks: [
        {id:airplane.id, meta: airplane.meta},
        {id:airplane2.id, meta: airplane2.meta},
        {id:airport.id, meta: airport.meta},
        {id:airport2.id, meta: airport2.meta},
        {id:"some not existing", meta: "some not existing"}
      ]
    })

    expect(getResult.length).toBe(4)
    expect(getResult.filter(r=>r.__typename === _specs_AirplaneItem.__type).filter(r => r.number_of_seats === 11).length).toBe(1)
    expect(getResult.filter(r=>r.__typename === _specs_AirplaneItem.__type).filter(r => r.number_of_seats === 13).length).toBe(1)
    expect(getResult.filter(r=>r.__typename === _specs_AirportItem.__type).filter(r => r.airport_size === 200).length).toBe(1)
    expect(getResult.filter(r=>r.__typename === _specs_AirportItem.__type).filter(r => r.airport_size === 300).length).toBe(1)
    
  })
})


