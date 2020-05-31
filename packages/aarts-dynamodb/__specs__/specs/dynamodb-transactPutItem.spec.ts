import { transactPutItem } from '../../dynamodb-transactPutItem';
import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from '../testmodel/_DynamoItems';
import { dynamoDbClient, DB_NAME, fromAttributeMap, uniqueitemrefkeyid, refkeyitemmeta } from '../../DynamoDbClient';
import { ItemList } from 'aws-sdk/clients/dynamodb';
import { stripCreatedUpdatedDates, clearDynamo, getBy_meta__smetadata, getBy_meta__nmetadata, withSMetadata } from '../testutils';
import { transactUpdateItem } from '../../dynamodb-transactUpdateItem';
import { ppjson } from 'aarts-types/utils';
import { DynamoItem, DomainItem } from '../../BaseItemManager';

beforeEach(clearDynamo)
describe('Creating new items, also cares for refkeys and aggregations', () => {

  test('inserts item with a non unique refkey', async () => {
    const airplane = new TestModel_AirplaneItem()
    airplane.home_airport = "kenedi"
    airplane.manifacturer = "az"
    airplane.model = "bg"
    airplane.test_prop = "test_pro"


    return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
      expect(result).toBeInstanceOf(TestModel_AirplaneItem)

      const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise();
      expect(fromAttributeMap(ddbItemResult.Item)).toEqual(airplane)

      const ddbRefkeyResult = await getBy_meta__smetadata(refkeyitemmeta(airplane, "home_airport"), "kenedi").promise()
      expect(
        stripCreatedUpdatedDates(
          fromAttributeMap(
            (ddbRefkeyResult.Items as ItemList)[0]))
      ).toEqual(
        {
          ...stripCreatedUpdatedDates(airplane),
          // item_type: refkeyitemtype(airplane, "home_airport"),
          meta: refkeyitemmeta(airplane, "home_airport"),
          smetadata: "kenedi"
        })

      const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
      expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)
    })
  })

  test('inserts item with a unique refkey, adds additional record', async () => {
    const airplane = new TestModel_AirplaneItem()
    airplane.number_of_seats = 15

    return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async result => {
      expect(result).toBeInstanceOf(TestModel_AirplaneItem)

      const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise();
      expect(fromAttributeMap(ddbItemResult.Item)).toEqual(airplane)

      const ddbRefkeyResult = await getBy_meta__nmetadata(refkeyitemmeta(airplane, "number_of_seats"), 15).promise()
      expect(
        stripCreatedUpdatedDates(
          fromAttributeMap(
            (ddbRefkeyResult.Items as ItemList)[0]))
      ).toEqual(
        {
          ...stripCreatedUpdatedDates(airplane),
          meta: refkeyitemmeta(airplane, "number_of_seats"),
          nmetadata: 15
        })

      const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
      expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)

      const ddbUniqueRecord = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: uniqueitemrefkeyid(airplane, "number_of_seats") }, meta: { S: `${15}` } } }).promise();
      expect(fromAttributeMap(ddbUniqueRecord.Item)).toEqual({id: "uq|airplane}number_of_seats", meta: `${15}`})
    })
  })
})
