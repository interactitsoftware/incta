import {
  _specs_AirplaneItem,
  _specs_AirportItem
} from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
import { transactPutItem } from "aarts-dynamodb"
import { clearDynamo } from "aarts-dynamodb/__specs__/testutils"
import { DynamoItem } from "aarts-dynamodb"
import { domainAdapter } from "../testmodel/itemManagersMap"

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
    const getGenerator = await domainAdapter.itemManagers[_specs_AirportItem.__type].get(
      {
        payload: {
          arguments: {pks: [{ id: arrangedAirplane.id }, { id: arrangedAirport.id }]},
          identity: "akrsmv"
        },
        meta: {
          item: "doesnt matter here",
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

    expect(processorGet.value.result?.items.length).toBe(2)
    //@ts-ignore
    expect(processorGet.value.result?.items.filter(a => a.__typename === _specs_AirplaneItem.__type).length).toBe(1)
    //@ts-ignore
    return expect(processorGet.value.result?.items.filter(a => a.__typename === _specs_AirportItem.__type).length).toBe(1)
  })

  test('will throw if payload arguments is an array', async () => {

    // you can get items of different types, no matter the particular item manager you call

    const callWithPayloadArray = async () => {
      for await (let a of domainAdapter.itemManagers[_specs_AirportItem.__type].get(
        {
          payload: {
            arguments: [{ id: arrangedAirplane.id }],
            identity: "akrsmv"
          },
          meta: {
            item: "doesnt matter here",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        })) return a
    }

    expect(callWithPayloadArray).rejects.toThrow(/payload.arguments must not be an array!/)

  })
})


