import { _specs_AirplaneItem } from "../../testmodel/_DynamoItems"
import { clearDynamo } from "../../testutils"
import { _specs_Airplane } from "../../testmodel/Airplane"
import { domainAdapter } from "../../testmodel/itemManagersMap"
import { dynamoDbClient, DB_NAME } from "../../../DynamoDbClient"
import { ScanOutput } from "aws-sdk/clients/dynamodb"

describe('manager.create.spec', () => {

  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must be an array', async () => {
    const domainItem = new _specs_AirplaneItem({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[_specs_AirplaneItem.__type].create(
        _specs_AirplaneItem.__type,
        {
          payload: {
            arguments: domainItem,
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/Payload is not a single element array/)

  })

  test('payload.arguments passed must be a single element array', async () => {
    const domainItem = new _specs_AirplaneItem({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[_specs_AirplaneItem.__type].create(
        _specs_AirplaneItem.__type,
        {
          payload: {
            arguments: [domainItem, domainItem],
            identity: "akrsmv"
          },
          meta: {
            item: "notneededfortest",
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/Payload is not a single element array/)

  })

  test('create as per payload passed', async () => {
    const domainItem = new _specs_AirplaneItem({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })
    const createGenerator = domainAdapter.itemManagers[_specs_AirplaneItem.__type].create(
      _specs_AirplaneItem.__type,
      {
        payload: {
          arguments: [domainItem],
          identity: "akrsmv"
        },
        meta: {
          item: "notneededfortest",
          action: "query",
          eventSource: "notneededfortest",
          ringToken: "notneededfortest"
        }
        
      }
    )
    let processorCreate = await createGenerator.next()
    do {
      if (!processorCreate.done) {
        processorCreate = await createGenerator.next()
      }
    } while (!processorCreate.done)


    //@ts-ignore
    expect(processorCreate.value.arguments.length).toBe(1)
    expect(processorCreate.value.arguments[0].duration_hours).toBe(15)
    expect(processorCreate.value.arguments[0].reg_uq_str).toBe("nomer5")
    expect(processorCreate.value.arguments[0].reg_uq_number).toBe(5)

    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
    const aggregations = allItems.Items?.filter(i => i.id.S === "aggregations")[0]
    expect(aggregations).toHaveProperty(_specs_AirplaneItem.__type)
    expect(aggregations && aggregations[_specs_AirplaneItem.__type].N).toBe("1")
    return expect(allItems.Count).toBe(6) // 2 uq constraints + 2 refkeys + the main item + aggregations = 6
  })
})


