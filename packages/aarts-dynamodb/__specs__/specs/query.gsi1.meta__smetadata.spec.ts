import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../DynamoDbClient"
import { transactDeleteItem } from "../../dynamodb-transactDeleteItem"
import { DynamoItem } from "../../BaseItemManager"

const seedAirtoursData = async () => {
  
}

describe('query gsi1 meta__smetadata', () => {

  beforeAll(async (done) => { 
    await clearDynamo(); 
    await seedAirtoursData()
    done() 
  })

  test('query all items having particular string refkey value', async () => {

    
  })
  test('query all items having particular refkey begining with value', async () => {

    
  })
})


