import { transactPutItem } from "../../dynamodb-transactPutItem";
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem";
import { refkeyitemmeta, versionString } from "../../DynamoDbClient";
import { _specs_FlightItem } from "../testmodel/_DynamoItems";
import { clearDynamo, queryForId } from "../testutils";


describe('update string refkey', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })

  test('update string refkey', async () => {
    // arrange string refkey to be updated, see testmodel
    const flight = Object.assign(new _specs_FlightItem(), { tourist_season: "season-1" })

    const arrangedItem = await transactPutItem(flight, _specs_FlightItem.__refkeys)

    const updateResult = await transactUpdateItem(arrangedItem, { // update arranged item
      id: arrangedItem.id,
      meta: arrangedItem.meta,
      revisions: arrangedItem.revisions,
      tourist_season: "season-2",
      ringToken: 'test-ring-token'
    }, _specs_FlightItem.__refkeys)

    expect(updateResult).toBeInstanceOf(_specs_FlightItem)

    const updatedItems = await queryForId(flight.id)

    const mainItem = updatedItems.filter(i => i.meta === `${versionString(0)}|${_specs_FlightItem.__type}`)[0]
    const refkeyItemCopy = updatedItems.filter(i => i.meta === refkeyitemmeta(flight, "tourist_season"))[0]

    expect(mainItem.tourist_season).toBe("season-2")
    expect(refkeyItemCopy).toEqual({
      id: mainItem.id,
      meta: refkeyitemmeta(flight, "tourist_season"),
      smetadata: "season-2"
    })
  })
})
