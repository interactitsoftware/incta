import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { GenerateInvoicesItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"


export class GenerateInvoicesCommand extends BaseDynamoItemManager<GenerateInvoicesItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: AartsPayload<GenerateInvoicesItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield { result: [{ message: `Start GenerateInvoices Failed` }, errors] }
            throw new Error(`${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<GenerateInvoicesItem> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        return args.payload.arguments as GenerateInvoicesItem
    }
}
