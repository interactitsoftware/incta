import { transactDeleteItem } from "../../dynamodb-transactDeleteItem";
import { transactPutItem } from "../../dynamodb-transactPutItem";
import { deletedVersionString } from "../../DynamoDbClient";
import { _specs_AirplaneItem } from "../testmodel/_DynamoItems";
import { clearDynamo, queryForId } from "../testutils";

describe('delete item', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  // afterAll(async (done) => { await clearDynamo(); done() })

  test('delete item keeps history', async () => {
    //arrange with one refkey
    const airplane = Object.assign(new _specs_AirplaneItem(), {number_of_seats:13}) 
    await transactPutItem(airplane, _specs_AirplaneItem.__refkeys)

    const allBeforeDelete = await queryForId(airplane.id)
    expect(allBeforeDelete.length).toBe(2)
    expect(airplane.revisions).toBe(0)

    const deleteResult = await transactDeleteItem(airplane, _specs_AirplaneItem.__refkeys, "test-ringToken")
    expect(deleteResult).toEqual(airplane)
    expect(airplane.revisions).toBe(1)
    
    const allAfterDelete = await queryForId(airplane.id)
    expect(allAfterDelete.length).toBe(1)
    expect(allAfterDelete[0]).toEqual(Object.assign(airplane,{meta: `${deletedVersionString(1)}|${airplane.__typename}`, revisions: 0}))
    
  })
})


