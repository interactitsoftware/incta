import { transactPutItem } from "../../dynamodb-transactPutItem";
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem";
import { versionString } from "../../DynamoDbClient";
import { _specs_AirplaneItem } from "../testmodel/_DynamoItems";
import { clearDynamo, queryForId } from "../testutils";


describe('update.remove.refkey', () => {

  beforeAll(async (done) => { await clearDynamo(); done() })
  // afterAll(async (done) => { await clearDynamo(); done() })

  test('update remove refkey', async () => {

    const airplane = new _specs_AirplaneItem()
    airplane.number_of_seats = 11 // arrange string refkey to be deleted

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async arrangedItem => { // arrange existing item

      const result = await transactUpdateItem(arrangedItem, { // update arranged item
        id: arrangedItem.id,
        meta: arrangedItem.meta,
        revisions: arrangedItem.revisions,
        //@ts-ignore
        number_of_seats: "__del__"
      }, _specs_AirplaneItem.__refkeys)

        expect(result).toBeInstanceOf(_specs_AirplaneItem) // main item returned
        expect(result).toEqual(Object.assign({},airplane, {number_of_seats: undefined}))

        const all = await queryForId(airplane.id)
        expect(all.length).toBe(2) // 1 main item, 2 history of update [no 3 - refkey was deleted]
        
        const mainItem = all.filter(i => i.meta === `${versionString(0)}|${_specs_AirplaneItem.__type}`)[0]
        expect(mainItem).toEqual(Object.assign({}, airplane, {number_of_seats:undefined}))

    })
  })
})


