import { TestModel_AirplaneItem, /**TestModel_AirplaneRefkeys */ } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta } from "../../DynamoDbClient"

describe('update remove refkey', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  afterAll(async (done) => { await clearDynamo(); done() })

  test('update remove refkey', async () => {

    const airplane = new TestModel_AirplaneItem()
    airplane.number_of_seats = 11 // arrange string refkey to be deleted

    return await transactPutItem(airplane, TestModel_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item

      const result = await transactUpdateItem(arrangedItem, { // update arranged item
        id: arrangedItem.id,
        meta: arrangedItem.meta,
        revisions: arrangedItem.revisions,
        //@ts-ignore
        number_of_seats: "__del__"
      }, TestModel_AirplaneItem.__refkeys)

        expect(result).toBeInstanceOf(TestModel_AirplaneItem) // main item returned
        expect(result).toEqual(Object.assign({},airplane, {number_of_seats: undefined}))

        const all = await queryForId(airplane.id)
        expect(all.length).toBe(2) // 1 main item, 2 history of update [no 3 - refkey was deleted]
        
        const mainItem = all.filter(i => i.meta === `${versionString(0)}|${TestModel_AirplaneItem.__type}`)[0]
        expect(mainItem).toEqual(Object.assign({}, airplane, {number_of_seats:null}))

    })
  })
})


