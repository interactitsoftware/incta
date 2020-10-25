import { _specs_AirplaneItem, /**_specs_AirplaneRefkeys */ } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
import { transactPutItem } from "aarts-dynamodb"
import { clearDynamo, queryForId } from "aarts-dynamodb/__specs__/testutils"
import { versionString, refkeyitemmeta } from "aarts-dynamodb"
import { domainAdapter } from "../testmodel/itemManagersMap"

describe('manager.update.spec', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })

  test('update number refkey', async () => {

    const airplane = new _specs_AirplaneItem({ number_of_seats: 11 })

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item

      const updateGen = await domainAdapter.itemManagers[_specs_AirplaneItem.__type].update(_specs_AirplaneItem.__type,
        {
          payload: {
            arguments: [{ // update arranged item
              id: arrangedItem.id,
              meta: arrangedItem.meta,
              revisions: arrangedItem.revisions,
              number_of_seats: 13
            }],
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }

        })

      let updateProcessor = await updateGen.next()
      do {
        if (!updateProcessor.done) {
          updateProcessor = await updateGen.next()
        }
      } while (!updateProcessor.done)

      if (updateProcessor.value.resultItems && updateProcessor.value.resultItems[0]) {
        expect(updateProcessor.value.resultItems[0].number_of_seats).toBe(11)
      } else {
        throw new Error("resultItems was null")
      }

      const createdItems = await queryForId(airplane.id)

      const mainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${_specs_AirplaneItem.__type}`)[0]
      const refkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(airplane, "number_of_seats"))[0]

      expect(mainItem.id).toEqual(refkeyItemCopy.id)
      expect(refkeyItemCopy.nmetadata).toEqual(13)
    })
  })
  test('update remove refkey', async () => {

    const airplane = new _specs_AirplaneItem({ number_of_seats: 11, manifacturer: "to", some_other_prop: 14, another_prop: "14", ringToken: "someringtoken" })

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item

      const allBeforeUpdate = await queryForId(airplane.id)
      expect(allBeforeUpdate.length).toBe(4) // 1 main item, 2 refkey for manifacturer, 3 refkey for number_of_seats, 4 - ringToken

      const updateGen = await domainAdapter.itemManagers[_specs_AirplaneItem.__type].update(_specs_AirplaneItem.__type,
        {
          payload: {
            arguments: [{ // update arranged item
              id: arrangedItem.id,
              meta: arrangedItem.meta,
              revisions: arrangedItem.revisions,
              //@ts-ignore
              number_of_seats: "__del__"
            }],
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "the new ring token"
          }

        })

      let updateProcessor = await updateGen.next()
      do {
        if (!updateProcessor.done) {
          updateProcessor = await updateGen.next()
        }
      } while (!updateProcessor.done)
      if (updateProcessor.value.resultItems && updateProcessor.value.resultItems[0]) {
        expect(updateProcessor.value.resultItems[0]).toEqual(Object.assign({}, airplane, { number_of_seats: undefined, revisions: 1 }))// main item returned, 
      } else {
        throw new Error("resultItems was null")
      }
      const all = await queryForId(airplane.id)
      expect(all.length).toBe(4) // 1 main item, 2 history of update, 3 refkey for manifacturer, 4 - ringToken [no 5 - refkey for number_of_seats was deleted]

      expect(JSON.stringify(all.filter(item => item.meta.startsWith("v_1")).map(item => item.ringToken))).toBe(JSON.stringify(["someringtoken"])) // and the history record contains the old ringToken value

      const mainItem = all.filter(i => i.meta === `${versionString(0)}|${_specs_AirplaneItem.__type}`)[0]
      expect(mainItem).toEqual(Object.assign({}, airplane, { number_of_seats: undefined, revisions: 1, ringToken: "the new ring token" }))

    })
  })

  test('update adds refkeys if not exist yet', async () => {

    const airplane = new _specs_AirplaneItem({ prop_not_updated: 555, number_of_seats: 11, manifacturer: "to", some_other_prop: 14, another_prop: "14" })

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item, without a ringtoken

      const allBeforeUpdate = await queryForId(airplane.id)
      expect(allBeforeUpdate.length).toBe(3) // 1 main item, 2 refkey for manifacturer, 3 refkey for number_of_seats, [ no 4 - ringToken]

      const updateGen = await domainAdapter.itemManagers[_specs_AirplaneItem.__type].update(_specs_AirplaneItem.__type,
        {
          payload: {
            arguments: [{ // update arranged item
              id: arrangedItem.id,
              meta: arrangedItem.meta,
              revisions: arrangedItem.revisions,
              //@ts-ignore
              number_of_seats: "__del__"
            }],
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "the new ring token"
          }

        })

      let updateProcessor = await updateGen.next()
      do {
        if (!updateProcessor.done) {
          updateProcessor = await updateGen.next()
        }
      } while (!updateProcessor.done)

      if (updateProcessor.value.resultItems && updateProcessor.value.resultItems[0]) {
        expect(updateProcessor.value.resultItems[0]).toEqual(Object.assign({}, airplane, { number_of_seats: undefined, revisions: 1 })) // main item returned, 
      } else {
        throw Error("resultItems was empty")
      }

      const all = await queryForId(airplane.id)
      expect(all.length).toBe(4) // 1 main item, 2 history of update, 3 refkey for manifacturer, 4 - ringToken [no 5 - refkey for number_of_seats was deleted]

      expect(JSON.stringify(all.filter(item => item.meta.startsWith("v_1")).map(item => item.ringToken))).toBe("[null]") // and the history record contains the old ringToken value

      const mainItem = all.filter(i => i.meta === `${versionString(0)}|${_specs_AirplaneItem.__type}`)[0]
      expect(mainItem).toEqual(Object.assign({}, airplane, { number_of_seats: undefined, revisions: 1, ringToken: "the new ring token" }))

      const newRefKeyItem = all.filter(i => i.meta === `${_specs_AirplaneItem.__type}}ringToken`)[0]
      expect(newRefKeyItem).toEqual({
        id: mainItem.id,
        meta: refkeyitemmeta(airplane, "ringToken"),
        smetadata: "the new ring token"
      })
    })
  })


  test('update does a single property update which is not a refkey', async () => {

    const airplane = new _specs_AirplaneItem({ number_of_seats: 11, manifacturer: "to", some_other_prop: 14, another_prop: "14" })

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item, without a ringtoken

      const allBeforeUpdate = await queryForId(airplane.id)
      expect(allBeforeUpdate.length).toBe(3) // 1 main item, 2 refkey for manifacturer, 3 refkey for number_of_seats, [ no 4 - ringToken]

      const updateGen = await domainAdapter.itemManagers[_specs_AirplaneItem.__type].update(_specs_AirplaneItem.__type,
        {
          payload: {
            arguments: [{ // update arranged item
              id: arrangedItem.id,
              meta: arrangedItem.meta,
              revisions: arrangedItem.revisions,
              prop_that_is_not_refkey: "tralalala"
            }],
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "update",
            eventSource: "notneededfortest",
            ringToken: "the new ring token"
          }

        })

      let updateProcessor = await updateGen.next()
      do {
        if (!updateProcessor.done) {
          updateProcessor = await updateGen.next()
        }
      } while (!updateProcessor.done)
      if (updateProcessor.value.resultItems && updateProcessor.value.resultItems[0]) {
        expect(updateProcessor.value.resultItems[0]).toEqual(Object.assign({}, airplane, { revisions: 1 }))// main item returned, 
      } else {
        throw new Error("resultItems was null")
      }
      const all = await queryForId(airplane.id)
      expect(all.length).toBe(5) // 1 main item, 2 history of update, 3 refkey for manifacturer, 4 - ringToken, 5 - refkey for number_of_seats was deleted

      const mainItem = all.filter(i => i.meta === `${versionString(0)}|${_specs_AirplaneItem.__type}`)[0]
      expect(mainItem).toEqual(Object.assign({}, airplane, { prop_that_is_not_refkey: "tralalala", revisions: 1, ringToken: "the new ring token" }))

      const newRefKeyItem = all.filter(i => i.meta === `${_specs_AirplaneItem.__type}}ringToken`)[0]
      expect(newRefKeyItem).toEqual({
        id: mainItem.id,
        meta: refkeyitemmeta(airplane, "ringToken"),
        smetadata: "the new ring token"
      })
    })
  })
})

