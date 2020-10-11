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


    expect(processorCreate.value.resultItems?.length).toBe(1)
    if (processorCreate.value.resultItems && processorCreate.value.resultItems[0]) {
      expect(processorCreate.value.resultItems.length).toBe(1)
      expect(processorCreate.value.resultItems[0].duration_hours).toBe(15)
      expect(processorCreate.value.resultItems[0].reg_uq_str).toBe("nomer5")
      expect(processorCreate.value.resultItems[0].reg_uq_number).toBe(5)
    } else {
      throw Error("resultItems was empty")
    }


    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
    return expect(allItems.Count).toBe(5) // 2 uq constraints + 2 refkeys + the main item 
  })

  test('create as per payload passed using the passed id', async () => {
    const domainItem = new _specs_AirplaneItem({ id: `${_specs_AirplaneItem.__type}|test456`, duration_hours: 15, reg_uq_str: "nomer7", reg_uq_number: 7 })
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


    expect(processorCreate.value.resultItems?.length).toBe(1)
    if (processorCreate.value.resultItems && processorCreate.value.resultItems[0]) {
      expect(processorCreate.value.resultItems[0].id).toBe(`${_specs_AirplaneItem.__type}|test456`)
      expect(processorCreate.value.resultItems[0].duration_hours).toBe(15)
      expect(processorCreate.value.resultItems[0].reg_uq_str).toBe("nomer7")
      expect(processorCreate.value.resultItems[0].reg_uq_number).toBe(7)
    } else {
      throw Error("resultItems was empty")
    }

    //assert all items created
    const allItems: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
    const createdItems = allItems.Items?.filter(i => i.id.S === `${_specs_AirplaneItem.__type}|test456`) as _specs_AirplaneItem[]
    const uqConstraints = allItems.Items?.filter(i => i.meta.S === "7" || i.meta.S === "nomer7") as _specs_AirplaneItem[]
    expect(createdItems.length).toBe(3)// 2 refkeys + the main item = 3
    // the 2 uq constraints
    expect(uqConstraints).toEqual([
      {id:{S:`uq|${_specs_AirplaneItem.__type}}reg_uq_str`}, meta: {S:"nomer7"}},
      {id:{S:`uq|${_specs_AirplaneItem.__type}}reg_uq_number`}, meta: {S:"7"}}
    ]) 
  })
})


