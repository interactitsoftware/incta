export const GenerateInvoicesCommand = 
`import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { GenerateInvoicesItem } from "../__bootstrap/_DynamoItems"
import { IIdentity } from "aarts-types/interfaces"
import { dynamoDbClient, DB_NAME } from "aarts-ddb"
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
            throw new Error(\`\${ringToken}: \${errors.join(";;")}\`)
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
    public onCreate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onCreate logic in here or delete this method*/
        // console.log("ON CREATE TRIGGERED for " + __type)
    }
    public onUpdate = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onUpdate logic in here or delete this method*/
        // console.log("ON UPDATE TRIGGERED for " + __type)
    }
    public onSuccess = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onSuccess logic in here or delete this method*/
        // console.log("ON SUCCESS TRIGGERED for " + __type)
    }
    public onError = async (__type: string, newImage: DynamoItem) => {
        /*Implement your custom onError logic in here or delete this method*/
        // console.log("ON ERROR TRIGGERED for " + __type)
    }
}
`