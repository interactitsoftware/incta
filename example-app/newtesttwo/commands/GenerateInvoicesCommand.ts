import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { GenerateInvoicesItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { dynamoDbClient, DB_NAME } from "aarts-dynamodb"
import { chunks } from "aarts-utils"
import { ScanOutput, WriteRequest } from "aws-sdk/clients/dynamodb"


export class GenerateInvoicesCommand extends BaseDynamoItemManager<GenerateInvoicesItem> {
    
    /**
    * Command parameters preparation and/or validation
    */
    async *validateStart(proc: GenerateInvoicesItem, identity: IIdentity, ringToken: string): AsyncGenerator<string, GenerateInvoicesItem, undefined> {

        // here you can apply further domain logic on permissions, authorizations etc
        const errors: string[] = []
        if (errors.length > 0) {
            yield 'Start GenerateInvoices Failed'
            throw new Error(`${ringToken}: ${errors.join(";;")}`)
        }

        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(proc: GenerateInvoicesItem, identity: IIdentity, ringToken: string) : Promise<GenerateInvoicesItem> { 

        // command implementation goes here
        // if you need to perform transactional work on another lambda use this.eventsForAsyncProcessing.push(evnt: AppsyncEvent)

        return proc
    }
}
