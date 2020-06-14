import { _specs_AirplaneItem, /**XXX _specs_AirplaneRefkeys */ } from "../../testmodel/_DynamoItems"
import { transactPutItem } from "../../../dynamodb-transactPutItem"
import { Strippable, clearDynamo, queryForId } from "../../testutils"
import { versionString, refkeyitemmeta, uniqueitemrefkeyid } from "../../../DynamoDbClient"


describe('create unique string refkey', () => {
  
  beforeAll(async (done) => { 
    await clearDynamo()
    done() 
  })
  // afterAll(async (done) => { await clearDynamo(); done() })

  test('create unique string refkey', async () => {
    const airplane = new _specs_AirplaneItem()
    airplane.reg_uq_str = "abcdef"

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async result => {
      expect(result).toBeInstanceOf(_specs_AirplaneItem)

      const ddbCreated = await queryForId(airplane.id)
      expect(ddbCreated.length).toBe(2)//1 main item,2 refkey item copy 

      const createdConstraints = await queryForId(uniqueitemrefkeyid(airplane, "reg_uq_str"))
      expect(createdConstraints.length).toBe(1)
      expect(createdConstraints[0]).toEqual({ id: uniqueitemrefkeyid(airplane, "reg_uq_str"), meta: "abcdef" })

    })
  })

  test('create unique string refkey consequent creates with same value will be rejected', async () => {
    const airplane = new _specs_AirplaneItem()
    airplane.reg_uq_str = "abcdef" // arrange already existing for create (prev test ensures existing, TODO make independant)

    return await expect(transactPutItem(airplane, _specs_AirplaneItem.__refkeys)).rejects.toThrow(/ConditionalCheckFailed/)

  })
})
