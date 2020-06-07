import { TestModel_AirplaneItem /**XXXTestModel_AirplaneRefkeys */ } from "../../testmodel/_DynamoItems"
import { transactPutItem } from "../../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../../testutils"
import { transactUpdateItem } from "../../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../../DynamoDbClient"
import { transactDeleteItem } from "../../../dynamodb-transactDeleteItem"


describe('delete item', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  // afterAll(async (done) => { await clearDynamo(); done() })

  test('delete item keeps history', async () => {

    const airplane = new TestModel_AirplaneItem({number_of_seats:13}) //arrange with one refkey
    await transactPutItem(airplane, TestModel_AirplaneItem.__refkeys)

    const allBeforeDelete = await queryForId(airplane.id)
    expect(allBeforeDelete.length).toBe(2)
    expect(airplane.revisions).toBe(0)

    const deleteResult = await transactDeleteItem(airplane, TestModel_AirplaneItem.__refkeys)
    expect(deleteResult).toEqual(airplane)
    expect(airplane.revisions).toBe(1)
    
    const allAfterDelete = await queryForId(airplane.id)
    expect(allAfterDelete.length).toBe(1)
    expect(allAfterDelete[0]).toEqual(Object.assign(airplane,{meta: `${deletedVersionString(1)}|${airplane.item_type}`, revisions: 0}))
    
  })
})


