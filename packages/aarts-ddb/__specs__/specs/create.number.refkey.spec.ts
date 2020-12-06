import { transactPutItem } from "../../dynamodb-transactPutItem"
import { refkeyitemmeta, versionString } from "../../DynamoDbClient"
import { _specs_AirplaneItem, _specs_FlightItem, /**XXX _specs_AirplaneRefkeys */} from "../testmodel/_DynamoItems"
import { clearDynamo, queryForId } from "../testutils"

describe('create number refkey', () => {
  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('create number refkey', async () => {
        // arrange string refkey to be created, see testmodel
        const flight = Object.assign(
          new _specs_FlightItem(),
          { duration_hours: 13 })

    const createdItem = await transactPutItem(flight, _specs_FlightItem.__refkeys)

      expect(createdItem).toBeInstanceOf(_specs_FlightItem)

      const createdItemsFromDb = await queryForId(flight.id)

      const mainItem = createdItemsFromDb.filter(i => i.meta === `${versionString(0)}|${_specs_FlightItem.__type}`)[0]
      const refkeyItemCopy = createdItemsFromDb.filter(i => i.meta === refkeyitemmeta(flight, "duration_hours"))[0]

      expect(mainItem.duration_hours).toBe(13)
      expect(refkeyItemCopy).toEqual({
        id:mainItem.id, 
        meta: refkeyitemmeta(flight, "duration_hours"),
        nmetadata: 13
      })
  })
})
