import { TestModel_AirplaneItem, /**XXXTestModel_AirplaneRefkeys */ 
TestModel_AirportItem} from "../../testmodel/_DynamoItems"
import { transactPutItem } from "../../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../../testutils"
import { transactUpdateItem } from "../../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../../DynamoDbClient"
import { transactDeleteItem } from "../../../dynamodb-transactDeleteItem"
import { domainAdapter } from "../../testmodel/itemManagersMap"
import { CognitoIdentity } from "aws-sdk"
import { DynamoItem } from "../../../BaseItemManager"

let arrangedAirplane:DynamoItem
let arrangedAirport: DynamoItem

describe('manager.get.spec', () => {

  beforeAll(async (done) => { 
    await clearDynamo();
    arrangedAirplane = await transactPutItem(new TestModel_AirplaneItem({reg_uq_str: "nomer5"}))
    arrangedAirport = await transactPutItem(new TestModel_AirportItem({airport_size: 20}))
    done() 
  })

  test('get 2 items of different type via single call to manager', async () => {
    
    // you can get items of different types, no matter the particular item manager you call
    const getGenerator = await domainAdapter.itemManagers[TestModel_AirportItem.__type].get("doesnt matter here",{
      arguments:[{id:arrangedAirplane.id}, {id:arrangedAirport.id}],
      identity:"akrsmv"
    })

    let processorGet = await getGenerator.next()
    do {
      if (!processorGet.done) {
        processorGet = await getGenerator.next()
      }
    } while (!processorGet.done)

    expect(processorGet.value.arguments.length).toBe(2)
    //@ts-ignore
    expect(processorGet.value.arguments.filter(a => a.item_type === TestModel_AirplaneItem.__type).length).toBe(1)
    //@ts-ignore
    return expect(processorGet.value.arguments.filter(a => a.item_type === TestModel_AirportItem.__type).length).toBe(1)
  })

  test('will throw if payload arguments is not an array', async () => {
    
    // you can get items of different types, no matter the particular item manager you call
    
    const callWithPayloadNotArray = async () => {
      for await (let a of domainAdapter.itemManagers[TestModel_AirportItem.__type].get("doesnt matter here",{
        arguments:{id:arrangedAirplane.id},
        identity:"akrsmv"
      })) return a
    }

    expect(callWithPayloadNotArray).rejects.toThrow(/is not an array\!/)

  })
})


