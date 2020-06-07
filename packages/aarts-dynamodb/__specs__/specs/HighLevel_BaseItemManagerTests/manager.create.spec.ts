import { TestModel_AirplaneItem } from "../../testmodel/_DynamoItems"
import { clearDynamo } from "../../testutils"
import { TestModel_Airplane } from "../../testmodel/Airplane"
import { domainAdapter } from "../../testmodel/itemManagersMap"
import { dynamoDbClient, DB_NAME } from "../../../DynamoDbClient"
import { ScanOutput } from "aws-sdk/clients/dynamodb"

describe('manager.create.spec', () => {

  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must be an array', async () => {
    const domainItem = new TestModel_Airplane({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[TestModel_AirplaneItem.__type].create(
        TestModel_AirplaneItem.__type,
        {
          arguments: domainItem,
          identity: "akrsmv"
        }
      )){}
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/is not an array\!/)

  })

  test('payload.arguments passed must be a single element array', async () => {
    const domainItem = new TestModel_Airplane({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[TestModel_AirplaneItem.__type].create(
        TestModel_AirplaneItem.__type,
        {
          arguments: [domainItem, domainItem],
          identity: "akrsmv"
        }
      )){}
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/excedes the max arguments array length constraint\(1\)/)

  })

  test('create as per payload passed', async () => {
    const domainItem = new TestModel_Airplane({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })
    const createGenerator = domainAdapter.itemManagers[TestModel_AirplaneItem.__type].create(
      TestModel_AirplaneItem.__type,
      {
        arguments: [domainItem],
        identity: "akrsmv"
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
    const allItems:ScanOutput = await dynamoDbClient.scan({TableName: DB_NAME}).promise()
    const aggregations = allItems.Items?.filter(i => i.id.S === "aggregations")[0]
    expect(aggregations).toHaveProperty(TestModel_AirplaneItem.__type)
    expect(aggregations && aggregations[TestModel_AirplaneItem.__type].N).toBe("1")
    return expect(allItems.Count).toBe(6) // 2 uq constraints + 2 refkeys + the main item + aggregations = 6
  })
})


