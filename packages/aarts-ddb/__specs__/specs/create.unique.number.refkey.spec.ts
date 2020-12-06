import { transactPutItem } from "../../dynamodb-transactPutItem"
import { uniqueitemrefkeyid } from "../../DynamoDbClient"
import { _specs_AirplaneItem } from "../testmodel/_DynamoItems"
import { clearDynamo, queryForId } from "../testutils"

describe('create unique number refkey', () => {
  beforeAll(async (done) => { 
    await clearDynamo()
    done() 
  })

  test('create unique number refkey', async () => {
    // arrange
    const airplane = Object.assign(new _specs_AirplaneItem(), {reg_uq_number: 13})
    // airplane.

    return await transactPutItem(airplane, _specs_AirplaneItem.__refkeys).then(async result => {
      expect(result).toBeInstanceOf(_specs_AirplaneItem)

      const ddbCreated = await queryForId(airplane.id)
      expect(ddbCreated.length).toBe(2)//1 main item,2 refkey item copy 

      const createdConstraints = await queryForId(uniqueitemrefkeyid(airplane, "reg_uq_number"))
      expect(createdConstraints.length).toBe(1)
      expect(createdConstraints[0]).toEqual({ id: uniqueitemrefkeyid(airplane, "reg_uq_number"), meta: "13" })

    })
  })

  test('consequent creates with same value will be rejected', async () => {
    const airplane = new _specs_AirplaneItem()
    airplane.reg_uq_number = 13 // arrange already existing for create (prev test ensures existing, TODO make independant)

    return await expect(transactPutItem(airplane, _specs_AirplaneItem.__refkeys)).rejects.toThrow()

  })
})

