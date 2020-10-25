import { BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { Proc__EraseDataItem } from "../__bootstrap/_DynamoItems"
import { AartsEvent, AartsPayload, IIdentity, IItemManager  } from "aarts-types/interfaces"


export class Proc__EraseDataCommand extends BaseDynamoItemManager<Proc__EraseDataItem> {
    
    /**
    * Command parameters preparation
    */
    async *validateStart(proc: AartsPayload<Proc__EraseDataItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
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
    async execute(__type: string, args: AartsEvent) : Promise<Proc__EraseDataItem> { 
        return args.payload.arguments as Proc__EraseDataItem
    }
}
