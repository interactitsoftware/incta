import { clearDynamo } from "aarts-dynamodb/__specs__/testutils"
import { dynamoDbClient, DB_NAME } from "aarts-dynamodb"
import { ScanOutput } from "aws-sdk/clients/dynamodb"
import { domainAdapter } from "../testmodel/itemManagersMap"
import { AirplaneItem } from "../testmodel/_DynamoItems"

describe('manager.create.spec', () => {

  beforeEach(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must not be an array', async () => {
    const domainItem = new AirplaneItem({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })

    const callWithPayloadArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[AirplaneItem.__type].create(
        {
          payload: {
            arguments: [domainItem],
            identity: "akrsmv"
          },
          meta: {
            item: AirplaneItem.__type,
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        }
      )) { }
    }

    return expect(callWithPayloadArray).rejects.toThrow(/payload.arguments must not be an array!/)

  })

  test('create as per payload passed', async () => {
    const domainItem = new AirplaneItem({ duration_hours: 15, reg_uq_str: "nomer5", reg_uq_number: 5 })
    const createGenerator = domainAdapter.itemManagers[AirplaneItem.__type].create(
      {
        payload: {
          arguments: domainItem,
          identity: "akrsmv"
        },
        meta: {
          item: AirplaneItem.__type,
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

      expect((processorCreate.value.result as AirplaneItem).duration_hours).toBe(15)
      expect((processorCreate.value.result as AirplaneItem).reg_uq_str).toBe("nomer5")
      expect((processorCreate.value.result as AirplaneItem).reg_uq_number).toBe(5)

    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
    return expect(allItems.Count).toBe(6) // 2 uq constraints + 2 refkeys + refkey on ringToken + the main item 
  })

  test('create as per payload passed using the passed id', async () => {
    const domainItem = new AirplaneItem({ id: `${AirplaneItem.__type}|test456`, duration_hours: 15, reg_uq_str: "nomer7", reg_uq_number: 7 })
    const createGenerator = domainAdapter.itemManagers[AirplaneItem.__type].create(
      {
        payload: {
          arguments: domainItem,
          identity: "akrsmv"
        },
        meta: {
          item: AirplaneItem.__type,
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

    expect((processorCreate.value.result as AirplaneItem).id).toBe(`${AirplaneItem.__type}|test456`)
    expect((processorCreate.value.result as AirplaneItem).duration_hours).toBe(15)
    expect((processorCreate.value.result as AirplaneItem).reg_uq_str).toBe("nomer7")
    expect((processorCreate.value.result as AirplaneItem).reg_uq_number).toBe(7)

    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
    const createdItems = allItems.Items?.filter(i => i.id.S === `${AirplaneItem.__type}|test456`) as AirplaneItem[]
    const uqConstraints = allItems.Items?.filter(i => i.meta.S === "7" || i.meta.S === "nomer7") as AirplaneItem[]
    expect(allItems.Items?.length).toBe(6)// 2 uq constraints + 2 refkeys + refkey on ringToken + the main item = 6
    expect(createdItems.length).toBe(4)//  2 refkeys + refkey on ringToken + the main item = 4
    // the 2 uq constraints
    expect(uqConstraints).toEqual([
      { id: { S: `uq|${AirplaneItem.__type}}reg_uq_str` }, meta: { S: "nomer7" } },
      { id: { S: `uq|${AirplaneItem.__type}}reg_uq_number` }, meta: { S: "7" } }
    ])
  })
})


