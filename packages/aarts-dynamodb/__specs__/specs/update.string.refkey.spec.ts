import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta } from "../../DynamoDbClient"

beforeAll(clearDynamo)
afterAll(clearDynamo)


test('update string refkey', async () => {

  const airplane = new TestModel_AirplaneItem()
  airplane.home_airport = "kenedi" // arrange string refkey to be updated, see testmodel

  return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async arrangedItem => { // arrange existing item
    
    await transactUpdateItem(arrangedItem, { // update arranged item
      id: arrangedItem.id,
      meta: arrangedItem.meta,
      revisions: arrangedItem.revisions,
      home_airport: "frankfurt"
    }, TestModel_AirplaneRefkeys).then(async updateResult => { 

      expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)

      const createdItems = await queryForId(airplane.id)

      const mainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${TestModel_AirplaneItem.__type}`)[0]
      const refkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(airplane, "home_airport"))[0]

      expect(new Strippable(mainItem).stripCreatedUpdatedDates().stripMeta()._obj)
      .toEqual(new Strippable(refkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripSmetadata()._obj)

    })
  })
})