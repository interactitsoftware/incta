import { TestModel_AirportItem, TestModel_AirplaneItem } from "../../testmodel/_DynamoItems"
import { clearDynamo } from "../../testutils"
import { TestModel_Airport } from "../../testmodel/Airport"
import { domainAdapter } from "../../testmodel/itemManagersMap"
import { ScanOutput } from "aws-sdk/clients/dynamodb"
import { dynamoDbClient, DB_NAME, deletedVersionString } from "../../../DynamoDbClient"
import { transactPutItem } from "../../../dynamodb-transactPutItem"


describe('manager.delete.spec', () => {

  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must be an array', async () => {

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[TestModel_AirportItem.__type].delete(
        TestModel_AirportItem.__type,
        {
          arguments: {},
          identity: "akrsmv"
        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/is not an array\!/)

  })

  test('payload.arguments passed must be a single element array', async () => {

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[TestModel_AirportItem.__type].delete(
        TestModel_AirportItem.__type,
        {
          arguments: [{}, {}],
          identity: "akrsmv"
        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/excedes the max arguments array length constraint\(1\)/)

  })


  test('payload.arguments must contain the items id and revisions keys', async () => {

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[TestModel_AirportItem.__type].delete(
        TestModel_AirportItem.__type,
        {
          arguments: [{ id: "id without proper revisions will fail" }],
          identity: "akrsmv"
        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/id and revisions keys is mandatory when deleting/)

  })

  test('delete will still fail if wrong revisions is passed', async () => {
    const arrangedItem1 = await transactPutItem(new TestModel_AirportItem({ airport_size: 20, name: "Sofia" }), TestModel_AirportItem.__refkeys)
    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[TestModel_AirportItem.__type].delete(
        TestModel_AirportItem.__type,
        {
          arguments: [{
            id: arrangedItem1.id,
            revisions: 15
          }],
          identity: "akrsmv"
        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/revisions passed does not match item revisions/)

  })

  describe('delete a previously created item', () => {
    beforeAll(async (done) => {
      await clearDynamo()
      done()
    })
    test('delete a previously created item', async () => {
      const arrangedItem2 = await transactPutItem(new TestModel_AirportItem({ airport_size: 20, name: "Sofia" }), TestModel_AirportItem.__refkeys)
      const deleteGenerator = domainAdapter.itemManagers[TestModel_AirportItem.__type].delete(
        TestModel_AirportItem.__type,
        {
          arguments: [{ id: arrangedItem2.id, revisions: arrangedItem2.revisions }], // the only two needed keys for a delete
          identity: "akrsmv"
        }
      )
      let processorDelete = await deleteGenerator.next()
      do {
        if (!processorDelete.done) {
          processorDelete = await deleteGenerator.next()
        }
      } while (!processorDelete.done)
  
      //assert all items deleted
      const allItemsAfterDelete: ScanOutput = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
      const aggregationsAfterDelete = allItemsAfterDelete.Items?.filter(i => i.id.S === "aggregations")[0]
      const deletedHistoryRecord = allItemsAfterDelete.Items?.filter(i => i.meta.S === `${deletedVersionString(1)}|${TestModel_AirportItem.__type}`)[0]
      expect(aggregationsAfterDelete).toHaveProperty(TestModel_AirportItem.__type)
      expect(aggregationsAfterDelete && aggregationsAfterDelete[TestModel_AirportItem.__type].N).toBe("0")
      expect(allItemsAfterDelete.Count).toBe(2) // aggregations + single history record
      expect(deletedHistoryRecord && deletedHistoryRecord.airport_size.N).toBe("20")
      expect(deletedHistoryRecord && deletedHistoryRecord.revisions.N).toBe("0")
    })
  })

})


