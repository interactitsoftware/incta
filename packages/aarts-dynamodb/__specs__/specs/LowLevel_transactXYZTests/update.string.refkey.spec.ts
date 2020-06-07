import { TestModel_FlightItem } from "../../testmodel/_DynamoItems"
import { transactPutItem } from "../../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../../testutils"
import { transactUpdateItem } from "../../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta } from "../../../DynamoDbClient"


describe('update string refkey', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  // afterAll(async (done) => { await clearDynamo(); done() })


  test('update string refkey', async () => {

    const flight = new TestModel_FlightItem({tourist_season: "season-1"})// arrange string refkey to be updated, see testmodel

    const arrangedItem = await transactPutItem(flight, TestModel_FlightItem.__refkeys)

    const updateResult = await transactUpdateItem(arrangedItem, { // update arranged item
        id: arrangedItem.id,
        meta: arrangedItem.meta,
        revisions: arrangedItem.revisions,
        tourist_season: "season-2"
      }, TestModel_FlightItem.__refkeys)

      expect(updateResult).toBeInstanceOf(TestModel_FlightItem)

      const createdItems = await queryForId(flight.id)

      const mainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${TestModel_FlightItem.__type}`)[0]
      const refkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(flight, "tourist_season"))[0]

      expect(mainItem.tourist_season).toBe("season-2")
      expect(new Strippable(mainItem).stripCreatedUpdatedDates().stripMeta()._obj)
        .toEqual(new Strippable(refkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripSmetadata()._obj)

  })
})
