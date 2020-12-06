import { _specs_AirportItem, _specs_AirplaneItem } from "aarts-ddb/__specs__/testmodel/_DynamoItems"
import { clearDynamo } from "aarts-ddb/__specs__/testutils"
import { _specs_Airport } from "aarts-ddb/__specs__/testmodel/Airport"
import { ScanOutput } from "aws-sdk/clients/dynamodb"
import { dynamoDbClient, DB_NAME, deletedVersionString } from "aarts-ddb"
import { transactPutItem } from "aarts-ddb"
import { domainAdapter } from "../testmodel/itemManagersMap"
import { AirportItem } from "../testmodel/_DynamoItems"


describe('manager.delete.spec', () => {

  beforeEach(async (done) => {
    await clearDynamo()
    done()
  })

  test('payload.arguments passed must not be an array', async () => {

    const callWithPayloadArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[_specs_AirportItem.__type].delete(
        {
          payload: {
            arguments: [{}],
            identity: "akrsmv"
          },
          meta: {
            item: AirportItem.__type,
            action: "delete",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        }
      )) { }
    }

    return expect(callWithPayloadArray).rejects.toThrow(/payload.arguments must not be an array!/)

  })

  test('payload.arguments passed must contain pks array', async () => {

    const callWithPayloadArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[_specs_AirportItem.__type].delete(
        {
          payload: {
            arguments: {},
            identity: "akrsmv"
          },
          meta: {
            item: AirportItem.__type,
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }
        }
      )) { }
    }

    return expect(callWithPayloadArray).rejects.toThrow(/evnt.payload.arguments.pks is not iterable/)

  })


  test('payload.arguments must contain the items id and revisions keys', async () => {

    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[_specs_AirportItem.__type].delete(
        {
          payload: {
            arguments: { pks: [{ id: "id without proper revisions will fail" }] },
            identity: "akrsmv"
          },
          meta: {
            item: AirportItem.__type,
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }

        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/id and revisions keys is mandatory when deleting/)

  })

  test('delete will still fail if wrong revisions is passed', async () => {
    const arrangedItem1 = await transactPutItem(new _specs_AirportItem({ airport_size: 20, name: "Sofia" }), _specs_AirportItem.__refkeys)
    const callWithPayloadNotArray = async () => {
      for await (let planeCreated of await domainAdapter.itemManagers[_specs_AirportItem.__type].delete(
        {
          payload: {
            arguments: {
              pks: [{
                id: arrangedItem1.id,
                revisions: 15
              }]
            },
            identity: "akrsmv"
          },
          meta: {
            item: AirportItem.__type,
            action: "query",
            eventSource: "notneededfortest",
            ringToken: "notneededfortest"
          }

        }
      )) { }
    }

    return expect(callWithPayloadNotArray).rejects.toThrow(/revisions passed does not match item revisions/)

  })

  test('delete a previously created item', async () => {
    //arrange
    const arrangedItem2 = await transactPutItem(new _specs_AirportItem({ airport_size: 20, name: "Sofia" }), _specs_AirportItem.__refkeys)

    // act
    const deleteGenerator = domainAdapter.itemManagers[_specs_AirportItem.__type].delete(
      {
        payload: {
          arguments: { pks: [{ id: arrangedItem2.id, revisions: arrangedItem2.revisions }] }, // the only two needed keys for a delete
          identity: "akrsmv"
        },
        meta: {
          item: AirportItem.__type,
          action: "delete",
          eventSource: "notneededfortest",
          ringToken: "notneededfortest"
        }

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
    const deletedHistoryRecord = allItemsAfterDelete.Items?.filter(i => i.meta.S === `${deletedVersionString(1)}|${_specs_AirportItem.__type}`)[0]
    expect(allItemsAfterDelete.Count).toBe(1) // single history record
    expect(deletedHistoryRecord && deletedHistoryRecord.airport_size.N).toBe("20")
    expect(deletedHistoryRecord && deletedHistoryRecord.revisions.N).toBe("0")
  })
})


