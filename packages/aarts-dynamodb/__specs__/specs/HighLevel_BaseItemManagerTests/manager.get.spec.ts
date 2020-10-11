import {
  _specs_AirplaneItem,
  _specs_AirportItem
} from "../../testmodel/_DynamoItems"
import { transactPutItem } from "../../../dynamodb-transactPutItem"
import { clearDynamo } from "../../testutils"
import { domainAdapter } from "../../testmodel/itemManagersMap"
import { DynamoItem } from "../../../BaseItemManager"

let arrangedAirplane: DynamoItem
let arrangedAirport: DynamoItem

describe('manager.get.spec', () => {

  beforeAll(async (done) => {
    await clearDynamo();
    arrangedAirplane = await transactPutItem(new _specs_AirplaneItem({ reg_uq_str: "nomer5" }))
    arrangedAirport = await transactPutItem(new _specs_AirportItem({ airport_size: 20 }))
    done()
  })

  test('get 2 items of different type via single call to manager', async () => {

    // you can get items of different types, no matter the particular item manager you call
    const getGenerator = await domainAdapter.itemManagers[_specs_AirportItem.__type].get("doesnt matter here",
      {
        payload: {
          arguments: [{pks: [{ id: arrangedAirplane.id }, { id: arrangedAirport.id }]}],
          identity: "akrsmv"
        },
        meta: {
          item: "notneededfortest",
          action: "get",
          eventSource: "notneededfortest",
          ringToken: "notneededfortest"
        }
      })

    let processorGet = await getGenerator.next()
    do {
      if (!processorGet.done) {
        processorGet = await getGenerator.next()
      }
    } while (!processorGet.done)

    expect(processorGet.value.arguments.length).toBe(2)
    //@ts-ignore
    expect(processorGet.value.arguments.filter(a => a.__typename === _specs_AirplaneItem.__type).length).toBe(1)
    //@ts-ignore
    return expect(processorGet.value.arguments.filter(a => a.__typename === _specs_AirportItem.__type).length).toBe(1)
  })

  test('will throw if payload arguments is not an array', async () => {

    // you can get items of different types, no matter the particular item manager you call

    const callWithPayloadNotArray = async () => {
      for await (let a of domainAdapter.itemManagers[_specs_AirportItem.__type].get("doesnt matter here",
        {
          payload: {
            arguments: { id: arrangedAirplane.id },
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        })) return a
    }

    expect(callWithPayloadNotArray).rejects.toThrow(/Payload is not a single element array/)

  })
})


