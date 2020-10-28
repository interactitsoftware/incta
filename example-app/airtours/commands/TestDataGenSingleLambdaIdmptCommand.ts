import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { TestDataGenSingleLambdaIdmptItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"


export class TestDataGenSingleLambdaIdmptCommand extends BaseDynamoItemManager<TestDataGenSingleLambdaIdmptItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: AartsPayload<TestDataGenSingleLambdaIdmptItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        proc.arguments.start_date = new Date().toISOString()

        const errors: string[] = []

        // here you can apply further domain logic on permissions, authorizations etc
        
        if (errors.length > 0) {
            yield { resultItems: [{ message: `Start TestDataGenSingleLambdaIdmpt Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<TestDataGenSingleLambdaIdmptItem> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        return args.payload.arguments as TestDataGenSingleLambdaIdmptItem
    }
}