import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../DynamoDbClient"
import { transactDeleteItem } from "../../dynamodb-transactDeleteItem"
import { DynamoItem } from "../../BaseItemManager"

describe('delete item', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })

  test('delete item keeps history', async () => {

    const airplane = new TestModel_AirplaneItem()
    airplane.number_of_seats = 11 // arrange one refkey
    await transactPutItem(airplane, TestModel_AirplaneItem.__refkeys)

    const allBeforeDelete = await queryForId(airplane.id)
    expect(allBeforeDelete.length).toBe(2)

    const deleteResult = await transactDeleteItem(airplane, TestModel_AirplaneItem.__refkeys)
    expect(deleteResult).toEqual(airplane)
    
    const allAfterDelete = await queryForId(airplane.id)
    expect(allAfterDelete.length).toBe(1)
    expect(allAfterDelete[0]).toEqual(Object.assign(airplane,{meta: `${deletedVersionString(1)}|${airplane.item_type}`, revisions: 0}))
    
  })
})


