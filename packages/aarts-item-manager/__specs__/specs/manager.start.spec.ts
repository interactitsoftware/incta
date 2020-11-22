import { _specs_AirplaneItem, _specs_FlightItem, _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
import { clearDynamo } from "aarts-dynamodb/__specs__/testutils"
import { _specs_Airplane } from "aarts-dynamodb/__specs__/testmodel/Airplane"

import { dynamoDbClient, DB_NAME } from "aarts-dynamodb"
import { ScanOutput } from "aws-sdk/clients/dynamodb"
import { domainAdapter } from "../testmodel/itemManagersMap"
import { _specs_DataImporterItem } from "../testmodel/_DynamoItems"

describe('manager.start', () => {

  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must not be array', async () => {
    const domainItem = new _specs_Airplane({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadArray = async () => {
      for await (let dataImporterResult of await domainAdapter.itemManagers[_specs_DataImporterItem.__type].start(
        {
          payload: {
            arguments: [domainItem, domainItem],
            identity: "akrsmv"
          },
          meta: {
            item: _specs_DataImporterItem.__type,
            action: "start",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }

        }
      )) { }
    }

    return expect(callWithPayloadArray).rejects.toThrow(/payload.arguments must not be an array!/)

  })

  test.only('starts corresponding procedure', async () => {

    const domainItem = new _specs_DataImporterItem()
    const createGenerator = domainAdapter.itemManagers[_specs_DataImporterItem.__type].start(
      {
        payload: {
          arguments: domainItem,
          identity: "akrsmv"
        },
        meta: {
          item: _specs_DataImporterItem.__type,
          action: "start",
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

    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
    return expect(allItems.Count).toBe(730) //total items after the test data seeder finishes
  })
})


