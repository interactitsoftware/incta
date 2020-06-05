import { TestModel_AirplaneItem, TestModel_AirplaneRefkeys } from "../testmodel/_DynamoItems"
import { transactPutItem } from "../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../testutils"
import { transactUpdateItem } from "../../dynamodb-transactUpdateItem"
import { versionString, refkeyitemmeta, deletedVersionString } from "../../DynamoDbClient"
import { transactDeleteItem } from "../../dynamodb-transactDeleteItem"
import { DynamoItem } from "../../BaseItemManager"

const seedAirtoursData = async () => {
  
}

describe('query gsi4 nmetadata__meta', () => {

  beforeAll(async (done) => { 
    await clearDynamo(); 
    await seedAirtoursData()
    done() 
  })

  test('query particular item tepes having something in common with a number refkey value', async () => {

    
  })

})


