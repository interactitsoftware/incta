import { _specs_AirplaneItem, /**XXX _specs_AirplaneRefkeys */} from "../../testmodel/_DynamoItems"
import { Strippable, clearDynamo, queryForId, testInsertOneNonUniqueRefKey } from "../../testutils"
import { transactPutItem } from "../../../dynamodb-transactPutItem";

describe('create number refkey', () => {
  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('create number refkey', async () => {
    return await testInsertOneNonUniqueRefKey({
      dynamoItemCtor: _specs_AirplaneItem,
      propRefKey: "number_of_seats",
      refKeyType: "number",
      itemRefKeys: _specs_AirplaneItem.__refkeys
    })
  })
})

