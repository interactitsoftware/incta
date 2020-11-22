import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { TestDataGeneratorItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { seedAirtoursData } from "aarts-dynamodb/__specs__/testmodel/testDataSeeder"


export class TestDataGeneratorCommand extends BaseDynamoItemManager<TestDataGeneratorItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: TestDataGeneratorItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, TestDataGeneratorItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield `Start TestDataGenerator Failed`
            throw new Error(`${ringToken}: ${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: TestDataGeneratorItem, identity: IIdentity, ringToken: string) : Promise<TestDataGeneratorItem> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        await seedAirtoursData()
        
        return proc
    }
}
