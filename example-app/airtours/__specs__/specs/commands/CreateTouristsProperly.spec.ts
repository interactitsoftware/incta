import { CreateTouristsProperlyCommand } from "../../../commands/CreateTouristsProperlyCommand"
import { CreateTouristsProperly } from "../../../__bootstrap/items/CreateTouristsProperly"
import { clearDynamo } from "../testutils"

import { CreateTouristsProperlyItem, TouristItem } from "../../../__bootstrap/_DynamoItems"
import { IItemManager } from "aarts-types"
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { domainAdapter } from "../../../__bootstrap"
import { uuid } from "aarts-utils"


describe('CreateTouristsProperly', () => {
  beforeAll(async (done) => {
    await clearDynamo()
    done()
  })

  test('CreateTouristsProperly', async () => {
    const testable = domainAdapter.itemManagers[CreateTouristsProperlyItem.__type] as BaseDynamoItemManager<CreateTouristsProperlyItem>
    console.log = jest.fn();
    for await (let res of await testable.start(CreateTouristsProperlyItem.__type, {
      // meta not needed here
      meta: { action: "start", eventSource: "worker:input", item: TouristItem.__type, ringToken: uuid() },
      payload: {
        arguments: [{
          "touristsToCreate": 5,
          "useNamesLength": 500,
          "toAirport": "Sofia airport",
          "fromAirport": "Novgorod airport",
          "toCountry": "Bulgaria",
          "fromCountry": "Russia",
          "airplane": "abc-airplane",
          "flight": "abc-flight"
        }],
        identity: {
          username: "testuser"
        }
      }
    })) { }

    expect(console.log).toHaveBeenCalledWith('Creating aarts-test-app...');
  })
})
