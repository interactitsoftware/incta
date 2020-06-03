import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { clearDynamo, testInsertOneNonUniqueRefKey } from "../testutils"

describe('create string refkey', () => {
  beforeAll(async (done) => { await clearDynamo(); done() })
  test('create string refkey', async () => {
    return await testInsertOneNonUniqueRefKey({
      dynamoItemCtor: TestModel_AirplaneItem,
      itemRefKeys: TestModel_AirplaneItem.__refkeys,
      propRefKey: "home_airport",
      refKeyType: "string"
    })
  })
})
