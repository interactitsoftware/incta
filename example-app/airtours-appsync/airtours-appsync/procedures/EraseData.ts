import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { AartsPayload, IIdentity } from "aarts-types/interfaces";
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { AppSyncEvent } from "aarts-eb-types/aartsEBUtil";
import { EraseDataItem } from "../_DynamoItems";

export class EraseData {

    public total_events: number = 0
    public succsess?: number
    public error?: number
    public processed_events?: boolean
    public start_date?: number
    public end_date?: number

    private publishAndRegister(event: AppSyncEvent) {
        dispatcher(event)
        this.total_events++
    }
    public start(__type: string, args: AartsPayload) {
        this.start_date = Date.now()

        return this;
    }
}

export class EraseDataManager extends BaseDynamoItemManager<EraseDataItem> {

    async *validateStart(proc: EraseDataItem, identity: IIdentity): AsyncGenerator<string, EraseDataItem, undefined> {
        const errors: string[] = []
        // can apply some domain logic on permissions, authorizations etc
        return proc // do nothing for now
    }

}