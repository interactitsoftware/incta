import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys, TestModel_AirportItem } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../DynamoDbClient"
import { transactDeleteItem } from "../../dynamodb-transactDeleteItem"
import { DynamoItem } from "../../BaseItemManager"
import { batchGetItem } from "../../dynamodb-batchGetItem"
import { TestModel_Airport } from "../testmodel/Airport"

describe('get', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })

  test('get items by PK', async () => {

    const airplane = new TestModel_AirplaneItem({number_of_seats: 11 })
    const airplane1 = new TestModel_AirplaneItem({number_of_seats: 12 })
    const airplane2 = new TestModel_AirplaneItem({number_of_seats: 13 })
    const airport = new TestModel_AirportItem({airport_size:200})
    const airport2 = new TestModel_AirportItem({airport_size: 300 })
    
    await transactPutItem(airplane, TestModel_AirplaneItem.__refkeys)
    await transactPutItem(airplane1, TestModel_AirplaneItem.__refkeys)
    await transactPutItem(airplane2, TestModel_AirplaneItem.__refkeys)
    await transactPutItem(airport, TestModel_AirportItem.__refkeys)
    await transactPutItem(airport2, TestModel_AirportItem.__refkeys)

    const getResult = await batchGetItem([
      {id:airplane.id, meta: airplane.meta},
      {id:airplane2.id, meta: airplane2.meta},
      {id:airport.id, meta: airport.meta},
      {id:airport2.id, meta: airport2.meta},
      {id:"some not existing", meta: "some not existing"}
    ])

    expect(getResult.length).toBe(4)
    expect(getResult.filter(r=>r.item_type === TestModel_AirplaneItem.__type).filter(r => r.number_of_seats === 11).length).toBe(1)
    expect(getResult.filter(r=>r.item_type === TestModel_AirplaneItem.__type).filter(r => r.number_of_seats === 13).length).toBe(1)
    expect(getResult.filter(r=>r.item_type === TestModel_AirportItem.__type).filter(r => r.airport_size === 200).length).toBe(1)
    expect(getResult.filter(r=>r.item_type === TestModel_AirportItem.__type).filter(r => r.airport_size === 300).length).toBe(1)
    
  })
})


