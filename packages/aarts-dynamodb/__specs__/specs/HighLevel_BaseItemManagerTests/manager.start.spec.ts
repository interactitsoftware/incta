import { _specs_AirplaneItem, _specs_DataImporterItem, _specs_FlightItem, _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem } from "../../testmodel/_DynamoItems"
import { clearDynamo } from "../../testutils"
import { _specs_Airplane } from "../../testmodel/Airplane"
import { domainAdapter } from "../../testmodel/itemManagersMap"
import { dynamoDbClient, DB_NAME } from "../../../DynamoDbClient"
import { ScanOutput } from "aws-sdk/clients/dynamodb"
import { _specs_DataImporter } from "../../testmodel/DataImporter"

describe('manager.start.spec', () => {

  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must be an array', async () => {
    const domainItem = new _specs_Airplane({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadNotArray = async () => {
      for await (let dataImporterResult of await domainAdapter.itemManagers[_specs_DataImporterItem.__type].start(
        _specs_DataImporterItem.__type,
        {
          payload:{
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
      )){}
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/is not an array\!/)

  })

  test('payload.arguments passed must be a single element array', async () => {
    const domainItem = new _specs_Airplane({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadNotArray = async () => {
      for await (let dataImporterResult of await domainAdapter.itemManagers[_specs_DataImporterItem.__type].start(
        _specs_DataImporterItem.__type,
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
      )){}
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/excedes the max arguments array length constraint\(1\)/)

  })

  test('starts corresponding procedure', async () => {
    const domainItem = new _specs_DataImporterItem({ prc_params: {a:"a",b:["b",1],d:{d1:"d1",d2:"d2",d3:1}}})
    const createGenerator = domainAdapter.itemManagers[_specs_DataImporterItem.__type].start(
      _specs_DataImporterItem.__type,
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
    // expect(processorCreate.value.arguments.length).toBe(1)
    // expect(processorCreate.value.arguments[0].duration_hours).toBe(15)
    // expect(processorCreate.value.arguments[0].reg_uq_str).toBe("nomer5")
    // expect(processorCreate.value.arguments[0].reg_uq_number).toBe(5)

    //assert all items created
    const allItems:ScanOutput = await dynamoDbClient.scan({TableName: DB_NAME}).promise()
    const aggregations = allItems.Items?.filter(i => i.id.S === "aggregations")[0]
    expect(aggregations).toHaveProperty(_specs_AirplaneItem.__type)

    expect(aggregations && aggregations[_specs_AirplaneItem.__type].N).toBe("5")
    expect(aggregations && aggregations[_specs_FlightItem.__type].N).toBe("20")
    expect(aggregations && aggregations[_specs_AirplaneManifacturerItem.__type].N).toBe("2")
    return expect(aggregations && aggregations[_specs_AirplaneModelItem.__type].N).toBe("3")

    // return expect(allItems.Count).toBe(6) // 2 uq constraints + 2 refkeys + the main item + aggregations = 6
  })
})


