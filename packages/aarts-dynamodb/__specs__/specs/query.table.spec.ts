import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../DynamoDbClient"
import { transactDeleteItem } from "../../dynamodb-transactDeleteItem"
import { DynamoItem } from "../../BaseItemManager"

const seedAirtoursData = async () => {
  
}

describe('query table', () => {

  beforeAll(async (done) => { 
    await clearDynamo(); 
    await seedAirtoursData()
    done() 
  })

  test('query for all related to an item', async () => {
    // todo all refkeys
    // all history
    
  })

  test('query for all related to a deleted item', async () => {
    // todo no refkeys
    // all history
    
  })
  
})


