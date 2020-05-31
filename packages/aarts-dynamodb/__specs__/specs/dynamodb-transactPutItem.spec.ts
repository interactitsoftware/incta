import { transactPutItem } from '../../dynamodb-transactPutItem';
import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from '../testmodel/_DynamoItems';
import { dynamoDbClient, DB_NAME, fromAttributeMap, refkeyitemtype, uniqueitemrefkeyid } from '../../DynamoDbClient';
import { refkeyitemid } from '../../DynamoDbClient';
import { ItemList } from 'aws-sdk/clients/dynamodb';
import { stripCreatedUpdatedDates, clearDynamo, getBy_meta__smetadata, getBy_meta__nmetadata } from '../testutils';
import { transactUpdateItem } from '../../dynamodb-transactUpdateItem';
import { ppjson } from 'aarts-types/utils';

beforeEach(clearDynamo)
describe('Creating new items, also cares for refkeys and aggregations', () => {

  // test('inserts item with a non unique refkey', async () => {
  //   const airplane = new TestModel_AirplaneItem()
  //   airplane.home_airport = "kenedi"

  //   return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
  //     expect(result).toBeInstanceOf(TestModel_AirplaneItem)

  //     const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise();
  //     expect(fromAttributeMap(ddbItemResult.Item)).toEqual(airplane)

  //     const ddbRefkeyResult = await getBy_meta__smetadata(refkeyitemid(airplane, "home_airport"), "kenedi").promise()
  //     expect(
  //       stripCreatedUpdatedDates(
  //         fromAttributeMap(
  //           (ddbRefkeyResult.Items as ItemList)[0]))
  //     ).toEqual(
  //       {
  //         ...stripCreatedUpdatedDates(airplane),
  //         item_type: refkeyitemtype(airplane, "home_airport"),
  //         meta: refkeyitemid(airplane, "home_airport"),
  //         smetadata: "kenedi"
  //       })

  //     const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
  //     expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)
  //   })
  // })

  test('updates item with a non unique refkey', async () => {
    const airplane = new TestModel_AirplaneItem()
    airplane.home_airport = "kenedi"

    return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async arrangedItem => { // arrange
      console.log("RESULT IS " + ppjson(arrangedItem))
      await transactUpdateItem(arrangedItem, { id: arrangedItem.id, meta: arrangedItem.meta, revisions: arrangedItem.revisions, home_airport: "frankfurt" }, TestModel_AirplaneRefkeys).then(async updateResult => { //act

        expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)

        const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise()
        expect(fromAttributeMap(ddbItemResult.Item)).toEqual(Object.assign({},airplane, { home_airport: "frankfurt" }))

        const ddbOldRefkeyResult = await getBy_meta__smetadata(refkeyitemid(airplane, "home_airport"), "kenedi").promise()
        expect(ddbOldRefkeyResult.Items && ddbOldRefkeyResult.Items.length).toBe(0)
        
        const ddbNewRefkeyResult = await getBy_meta__smetadata(refkeyitemid(airplane, "home_airport"), "frankfurt").promise()
        expect(
          stripCreatedUpdatedDates(
            fromAttributeMap(
              (ddbNewRefkeyResult.Items as ItemList)[0]))
        ).toEqual(
          {
            ...stripCreatedUpdatedDates(airplane),
            item_type: refkeyitemtype(airplane, "home_airport"),
            meta: refkeyitemid(airplane, "home_airport"),
            smetadata: "frankfurt",
            home_airport: "frankfurt",
            revisions: 1
          })

        const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
        expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)
      })
    })
  })

  // test('inserts item with a unique refkey, adds additional record', async () => {
  //   const airplane = new TestModel_AirplaneItem()
  //   airplane.number_of_seats = 15

  //   return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
  //     expect(result).toBeInstanceOf(TestModel_AirplaneItem)

  //     const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise();
  //     expect(fromAttributeMap(ddbItemResult.Item)).toEqual(airplane)

  //     const ddbRefkeyResult = await getBy_meta__nmetadata(refkeyitemid(airplane, "number_of_seats"), 15).promise()
  //     expect(
  //       stripCreatedUpdatedDates(
  //         fromAttributeMap(
  //           (ddbRefkeyResult.Items as ItemList)[0]))
  //     ).toEqual(
  //       {
  //         ...stripCreatedUpdatedDates(airplane),
  //         item_type: refkeyitemtype(airplane, "number_of_seats"),
  //         meta: refkeyitemid(airplane, "number_of_seats"),
  //         nmetadata: 15
  //       })

  //     const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
  //     expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)

  //     const ddbUniqueRecord = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: uniqueitemrefkeyid(airplane, "number_of_seats") }, meta: { S: `${15}` } } }).promise();
  //     expect(fromAttributeMap(ddbUniqueRecord.Item)).toEqual({id: "uq|airplane}number_of_seats", meta: `${15}`})
  //   })
  // })
})
