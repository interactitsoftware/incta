import { TestModel_AirplaneItem, /**XXX TestModel_AirplaneRefkeys */} from "../testmodel/_DynamoItems"
import { Strippable, clearDynamo, queryForId, testInsertOneNonUniqueRefKey } from "../testutils"

describe('create number refkey', () => {
  beforeAll(async (done) => { await clearDynamo(); done() })
  afterAll(async (done) => { await clearDynamo(); done() })

  test('create number refkey', async () => {
    return await testInsertOneNonUniqueRefKey({
      dynamoItemCtor: TestModel_AirplaneItem,
      propRefKey: "number_of_seats",
      refKeyType: "number",
      itemRefKeys: TestModel_AirplaneItem.__refkeys
    })
  })
})

