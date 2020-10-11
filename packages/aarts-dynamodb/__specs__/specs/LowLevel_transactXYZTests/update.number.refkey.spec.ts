import { _specs_AirplaneItem, /**_specs_AirplaneRefkeys */ } from "../../testmodel/_DynamoItems"
import { transactPutItem } from "../../../dynamodb-transactPutItem"
import { clearDynamo, queryForId } from "../../testutils"
import { transactUpdateItem } from "../../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta } from "../../../DynamoDbClient"

describe('update number refkey', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })

  test('update number refkey', async () => {

    const airplane = new _specs_AirplaneItem()
    airplane.number_of_seats = 11 // arrange string refkey to be updated, see testmodel

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item

      await transactUpdateItem(arrangedItem, { // update arranged item
        id: arrangedItem.id,
        meta: arrangedItem.meta,
        revisions: arrangedItem.revisions,
        number_of_seats: 13
      }, _specs_AirplaneItem.__refkeys).then(async updateResult => {

        expect(updateResult).toBeInstanceOf(_specs_AirplaneItem)

        const updatedItems = await queryForId(airplane.id)

        const mainItem = updatedItems.filter(i => i.meta === `${versionString(0)}|${_specs_AirplaneItem.__type}`)[0]
        const refkeyItemCopy = updatedItems.filter(i => i.meta === refkeyitemmeta(airplane, "number_of_seats"))[0]

        expect(refkeyItemCopy).toEqual({
          id:mainItem.id, 
          meta: refkeyitemmeta(airplane, "number_of_seats"),
          nmetadata: 13
        })

      })
    })
  })
})


