import { _specs_FlightItem } from "../../testmodel/_DynamoItems"
import { clearDynamo, testInsertOneNonUniqueRefKey } from "../../testutils"

describe('create string refkey', () => {
  beforeAll(async (done) => { await clearDynamo(); done() })

  test('create string refkey', async () => {
    return await testInsertOneNonUniqueRefKey({
      dynamoItemCtor: _specs_FlightItem,
      itemRefKeys: _specs_FlightItem.__refkeys,
      propRefKey: "tourist_season",
      refKeyType: "string"
    })
  })
})
