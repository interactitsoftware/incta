import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { versionString, refkeyitemmeta } from "../../DynamoDbClient"

beforeAll(clearDynamo)
// afterAll(clearDynamo)
test('create number refkey', async () => {
  const airplane = new TestModel_AirplaneItem()
  airplane.number_of_seats = 13

  return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
    expect(result).toBeInstanceOf(TestModel_AirplaneItem)

    const createdItems = await queryForId(airplane.id)

    expect(createdItems.length).toBe(2)

    const mainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${TestModel_AirplaneItem.__type}`)[0]
    const refkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(airplane, "number_of_seats"))[0]

    expect(new Strippable(mainItem).stripCreatedUpdatedDates().stripMeta()._obj)
      .toEqual(new Strippable(refkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripNmetadata()._obj)

    })
})