
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { VisibleFlightsForUserItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class VisibleFlightsForUserQuery extends BaseDynamoItemManager<VisibleFlightsForUserItem> {
    // Queries are BaseDynamoItemManagers with overwritten query method. Code will not call validateQuery and baseValidateQuery in this case
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {

        return { resultItems: [{}] }
    }
}
