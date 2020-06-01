import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { dynamoDbClient, DB_NAME, fromAttributeMapArray, versionString, refkeyitemmeta } from "../../DynamoDbClient"
import { ppjson } from "aarts-types/utils"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { ItemList } from "aws-sdk/clients/dynamodb"

beforeAll(clearDynamo)
afterAll(clearDynamo)

test('create string refkey', async () => {
  const airplane = new TestModel_AirplaneItem()
  airplane.home_airport = "kenedi"

  return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
    expect(result).toBeInstanceOf(TestModel_AirplaneItem)

    const createdItems = await queryForId(airplane.id)

    expect(createdItems.length).toBe(2)

    const mainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${TestModel_AirplaneItem.__type}`)[0]
    const refkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(airplane, "home_airport"))[0]

    expect(new Strippable(mainItem).stripCreatedUpdatedDates().stripMeta()._obj)
      .toEqual(new Strippable(refkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripSmetadata()._obj)

  })
})