import { BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { Proc__TestDataGenMultipleLambdaIdmptChunksItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"


export class Proc__TestDataGenMultipleLambdaIdmptChunksCommand extends BaseDynamoItemManager<Proc__TestDataGenMultipleLambdaIdmptChunksItem> {
    
    /**
    * Command parameters preparation
    */
    async *validateStart(proc: AartsPayload<Proc__TestDataGenMultipleLambdaIdmptChunksItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        const errors: string[] = []
        proc.arguments.total_events = // calculated based on command input
        proc.arguments.start_date = Date.now()
        // can apply further domain logic on permissions, authorizations etc
        // if this method returns without throwing error, the execute method will be called 
        return proc
    }

    /**
    * Command Implementation
    */
    async execute(__type: string, args: AartsEvent) : Promise<Proc__TestDataGenMultipleLambdaIdmptChunksItem> { 
        return args.payload.arguments as Proc__TestDataGenMultipleLambdaIdmptChunksItem
    }
}
