import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../DynamoDbClient"
import { transactDeleteItem } from "../../dynamodb-transactDeleteItem"
import { DynamoItem } from "../../BaseItemManager"

const seedAirtoursData = async () => {
  
}

describe('query gsi2 meta__nmetadata', () => {

  beforeAll(async (done) => { 
    await clearDynamo(); 
    await seedAirtoursData()
    done() 
  })

  test('query all items having particular number refkey value', async () => {

    
  })
  test('query all items having particular refkey greater than number value', async () => {

    
  })
  test('query all items having particular refkey lower than number value', async () => {

    
  })
  test('query all items having particular refkey between 2 number values', async () => {

    
  })

})


