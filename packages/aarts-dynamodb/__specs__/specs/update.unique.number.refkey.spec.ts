import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, uniqueitemrefkeyid } from "../../DynamoDbClient"

beforeAll(clearDynamo)
afterAll(clearDynamo)

test('update unique number refkey', async () => {

  const airplane = new TestModel_AirplaneItem()
  airplane.unique_id_nr = 11 // arrange string refkey to be updated, see testmodel

  return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async arrangedItem => { // arrange existing item
    
    await transactUpdateItem(arrangedItem, { // update arranged item
      id: arrangedItem.id,
      meta: arrangedItem.meta,
      revisions: arrangedItem.revisions,
      unique_id_nr: 13
    }, TestModel_AirplaneRefkeys).then(async updateResult => { 
      expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)

      const createdConstraints = await queryForId(uniqueitemrefkeyid(airplane, "unique_id_nr"))

      expect(createdConstraints.length).toBe(1)
      expect(createdConstraints[0]).toEqual({id: uniqueitemrefkeyid(airplane, "unique_id_nr"), meta: "13"})

    })
  })
})

test('other item updates setting same value will be rejected', async () => {
  const airplane = new TestModel_AirplaneItem()
  airplane.unique_id_nr = 11
  
  const arrangedItem = await transactPutItem(airplane, TestModel_AirplaneRefkeys) // arange another item

  const promised = transactUpdateItem(arrangedItem, { // update arranged item
    id: arrangedItem.id,
    meta: arrangedItem.meta,
    revisions: arrangedItem.revisions,
    unique_id_nr: 13
  }, TestModel_AirplaneRefkeys)

  return expect(promised).rejects

})