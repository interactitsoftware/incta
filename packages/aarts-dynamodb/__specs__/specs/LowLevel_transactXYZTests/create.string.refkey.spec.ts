import { versionString } from "aarts-utils/utils";
import { transactPutItem } from "../../../dynamodb-transactPutItem";
import { refkeyitemmeta } from "../../../DynamoDbClient";
import { _specs_FlightItem } from "../../testmodel/_DynamoItems"
import { clearDynamo, queryForId } from "../../testutils"

describe('create.string.refkey', () => {
  beforeAll(async (done) => { await clearDynamo(); done() })

  test('create string refkey', async () => {
    const flight = new _specs_FlightItem({tourist_season: "season-1"})// arrange string refkey to be created, see testmodel

    const createdItem = await transactPutItem(flight, _specs_FlightItem.__refkeys)

      expect(createdItem).toBeInstanceOf(_specs_FlightItem)

      const createdItemsFromDb = await queryForId(flight.id)

      const mainItem = createdItemsFromDb.filter(i => i.meta === `${versionString(0)}|${_specs_FlightItem.__type}`)[0]
      const refkeyItemCopy = createdItemsFromDb.filter(i => i.meta === refkeyitemmeta(flight, "tourist_season"))[0]

      expect(mainItem.tourist_season).toBe("season-1")
      expect(refkeyItemCopy).toEqual({
        id:mainItem.id, 
        meta: refkeyitemmeta(flight, "tourist_season"),
        smetadata: "season-1"
      })
  })
})
