import { transactPutItem } from '../../dynamodb-transactPutItem';
import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from '../testmodel/_DynamoItems';
import { dynamoDbClient, DB_NAME, fromAttributeMap, refkeyitemmeta } from '../../DynamoDbClient';
import { ItemList } from 'aws-sdk/clients/dynamodb';
import { stripCreatedUpdatedDates, clearDynamo, getBy_meta__smetadata, getBy_meta__nmetadata } from '../testutils';
import { transactUpdateItem } from '../../dynamodb-transactUpdateItem';

beforeEach(clearDynamo)
describe('update', () => {

    test('string refkey', async () => {
        const airplane = new TestModel_AirplaneItem()
        airplane.home_airport = "kenedi" // arrange string refkey to be updated, see TestModel
    
        return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async arrangedItem => { // arrange
          await transactUpdateItem(arrangedItem, { id: arrangedItem.id, meta: arrangedItem.meta, revisions: arrangedItem.revisions, home_airport: "frankfurt" }, TestModel_AirplaneRefkeys).then(async updateResult => { //act
    
            expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)
            const expectedItem = {
              ...stripCreatedUpdatedDates(airplane),
              home_airport: "frankfurt", // update performed
              revisions: 1
            }
            expect(stripCreatedUpdatedDates(updateResult)).toEqual(expectedItem)
    
            // asert the itam main copy exists (that is, when accessed by version string, not via a refkey)
            const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise()
            expect(stripCreatedUpdatedDates(fromAttributeMap(ddbItemResult.Item))).toEqual(expectedItem)
    
            // assert old ref key was deleted
            const ddbOldRefkeyResult = await getBy_meta__smetadata(refkeyitemmeta(airplane, "home_airport"), "kenedi").promise()
            expect(ddbOldRefkeyResult.Items && ddbOldRefkeyResult.Items.length).toBe(0)
            
            // assert updated refkey present
            const ddbNewRefkeyResult = await getBy_meta__smetadata(refkeyitemmeta(airplane, "home_airport"), "frankfurt").promise()
            expect(
              stripCreatedUpdatedDates(
                fromAttributeMap(
                  (ddbNewRefkeyResult.Items as ItemList)[0]))
                  //@ts-ignore
            ).toEqual(Object.assign({}, expectedItem, {meta: refkeyitemmeta(expectedItem, "home_airport"), smetadata: "frankfurt"}))
            
            // assert aggregations unchanged
            const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
            expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)
          })
        })
      })

      test('updating an item\'s refkey of type number, it also updates corresponding item copy (located by GSI meta/nmetadata)', async () => {
        const airplane = new TestModel_AirplaneItem()
        airplane.number_of_seats = 11 // arrange refkey of type number to be updated, see TestModel
    
        return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async arrangedItem => { // arrange
          await transactUpdateItem(arrangedItem, { id: arrangedItem.id, meta: arrangedItem.meta, revisions: arrangedItem.revisions, number_of_seats: 13 }, TestModel_AirplaneRefkeys).then(async updateResult => { //act
    
            expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)
            const expectedItem = {
              ...stripCreatedUpdatedDates(airplane),
              number_of_seats: 13, // update performed
              revisions: 1
            }
            expect(stripCreatedUpdatedDates(updateResult)).toEqual(expectedItem)
    
            // asert the itam main copy exists (that is, when accessed by version string, not via a refkey)
            const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise()
            expect(stripCreatedUpdatedDates(fromAttributeMap(ddbItemResult.Item))).toEqual(expectedItem)
    
            // assert old ref key was deleted
            const ddbOldRefkeyResult = await getBy_meta__nmetadata(refkeyitemmeta(airplane, "number_of_seats"), 11).promise()
            expect(ddbOldRefkeyResult.Items && ddbOldRefkeyResult.Items.length).toBe(0)
            
            // assert updated refkey present
            const ddbNewRefkeyResult = await getBy_meta__nmetadata(refkeyitemmeta(airplane, "number_of_seats"), 13).promise()
            expect(
              stripCreatedUpdatedDates(
                fromAttributeMap(
                  (ddbNewRefkeyResult.Items as ItemList)[0]))
                  //@ts-ignore
            ).toEqual(Object.assign({}, expectedItem, {meta: refkeyitemmeta(expectedItem, "number_of_seats"), nmetadata: 13}))
            
            // assert aggregations unchanged
            const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
            expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)
          })
        })
      })

      test('updating an item\'s refkey of type number and unique=true, to a value that already exists, will cause the update to fail ', async () => {
        const airplane = new TestModel_AirplaneItem()
        airplane.number_of_seats = 11 // arrange refkey of type number to be updated, see TestModel
        await transactPutItem(Object.assign({}, airplane,{number_of_seats:13}), TestModel_AirplaneRefkeys) // arrange already present uniqe refkey with value 13
        await transactPutItem(Object.assign({}, airplane,{number_of_seats:13}), TestModel_AirplaneRefkeys) // arrange already present uniqe refkey with value 13

        return await transactPutItem(airplane, TestModel_AirplaneRefkeys).then(async arrangedItem => { // arrange
          await transactUpdateItem(arrangedItem, { id: arrangedItem.id, meta: arrangedItem.meta, revisions: arrangedItem.revisions, number_of_seats: 13 }, TestModel_AirplaneRefkeys).then(async updateResult => { //act
    
            expect(updateResult).toBeInstanceOf(TestModel_AirplaneItem)
            const expectedItem = {
              ...stripCreatedUpdatedDates(airplane),
              number_of_seats: 13, // update performed
              revisions: 1
            }
            expect(stripCreatedUpdatedDates(updateResult)).toEqual(expectedItem)
    
            // asert the itam main copy exists (that is, when accessed by version string, not via a refkey)
            const ddbItemResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: airplane.id }, meta: { S: airplane.meta } } }).promise()
            expect(stripCreatedUpdatedDates(fromAttributeMap(ddbItemResult.Item))).toEqual(expectedItem)
    
            // assert old ref key was deleted
            const ddbOldRefkeyResult = await getBy_meta__nmetadata(refkeyitemmeta(airplane, "number_of_seats"), 11).promise()
            expect(ddbOldRefkeyResult.Items && ddbOldRefkeyResult.Items.length).toBe(0)
            
            // assert updated refkey present
            const ddbNewRefkeyResult = await getBy_meta__nmetadata(refkeyitemmeta(airplane, "number_of_seats"), 13).promise()
            expect(
              stripCreatedUpdatedDates(
                fromAttributeMap(
                  (ddbNewRefkeyResult.Items as ItemList)[0]))
                  //@ts-ignore
            ).toEqual(Object.assign({}, expectedItem, {meta: refkeyitemmeta(expectedItem, "number_of_seats"), nmetadata: 13}))
            
            // assert aggregations unchanged
            const ddbAggregationsResult = await dynamoDbClient.getItem({ TableName: DB_NAME, Key: { id: { S: "aggregations" }, meta: { S: "totals" } } }).promise();
            expect(fromAttributeMap(ddbAggregationsResult.Item)).toHaveProperty("airplane", 1)
          })
        })
      })
})
