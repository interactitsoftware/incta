import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { versionString, refkeyitemmeta, uniqueitemrefkeyid } from "../../DynamoDbClient"

beforeAll(clearDynamo)
afterAll(clearDynamo)

test('create unique string refkey', async () => {
  const airplane = new TestModel_AirplaneItem()
  airplane.unique_id_str = "abcdef"

  return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
    expect(result).toBeInstanceOf(TestModel_AirplaneItem)
  
    const createdConstraints = await queryForId(uniqueitemrefkeyid(airplane, "unique_id_str"))

    expect(createdConstraints.length).toBe(1)
    expect(createdConstraints[0]).toEqual({id: uniqueitemrefkeyid(airplane, "unique_id_str"), meta: "abcdef"})

  })
})

test('consequent creates with same value will be rejected', async () => {
  const airplane = new TestModel_AirplaneItem()
  airplane.unique_id_str = "abcdef"
  
  const promised = transactPutItem(airplane, TestModel_AirplaneRefkeys)
  return expect(promised).rejects

})