import { TestModel_AirplaneItem, /**TestModel_AirplaneRefkeys */ } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta } from "../../DynamoDbClient"

describe('update number refkey', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  afterAll(async (done) => { await clearDynamo(); done() })

  test('update number refkey', async () => {

    const airplane = new TestModel_AirplaneItem()
    airplane.number_of_seats = 11 // arrange string refkey to be updated, see testmodel

    return await transactPutItem(airplane, TestModel_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item

      await transactUpdateItem(arrangedItem, { // update arranged item
        id: arrangedItem.id,
        meta: arrangedItem.meta,
        revisions: arrangedItem.revisions,
        number_of_seats: 13
      }, TestModel_AirplaneItem.__refkeys).then(async updateResult => {

        expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)

        const createdItems = await queryForId(airplane.id)

        const mainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${TestModel_AirplaneItem.__type}`)[0]
        const refkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(airplane, "number_of_seats"))[0]

        expect(new Strippable(mainItem).stripCreatedUpdatedDates().stripMeta()._obj)
          .toEqual(new Strippable(refkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripNmetadata()._obj)

      })
    })
  })
})


