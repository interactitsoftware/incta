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

    return expect(callWithPayloadNotArray).rejects.toThrow(/\[Proc__AirtoursDataImporter:baseValidateStart\] Payload is not a single element array! \{\}/)

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
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/Payload is not a single element array/)

  })

  test('starts corresponding procedure', async () => {
    const prc_params = { a: "a", b: ["b", 1], d: { d1: "d1", d2: "d2", d3: 1 } }
    const domainItem = new _specs_DataImporterItem({ prc_params })
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


    expect(processorCreate.value.resultItems?.length).toBe(1)
    if (processorCreate.value.resultItems && processorCreate.value.resultItems[0]) {
      expect(processorCreate.value.resultItems[0].arguments.prc_params).toEqual(prc_params)
    } else {
      throw Error("result items was empty")
    }

    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()

    return expect(allItems.Count).toBe(730) //total items after the test data seeder finishes
  })
})


