
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { FlightsInvolvingCountryItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class FlightsInvolvingCountryQuery extends BaseDynamoItemManager<FlightsInvolvingCountryItem> {
    // Queries are BaseDynamoItemManagers with overwritten query method. Code will not call validateQuery and baseValidateQuery in this case
    async *query(item: string, args: AartsEvent): AsyncGenerator<string, AartsPayload, undefined> {

        return { result: {} }
    }
}
