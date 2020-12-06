
export const FlightsInvolvingCountryQuery = 
`import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { FlightsInvolvingCountryItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class FlightsInvolvingCountryQuery extends BaseDynamoItemManager<FlightsInvolvingCountryItem> {
    // Custom Queries are BaseDynamoItemManagers with overwritten query method. 
    // Code will not call validateQuery and __ValidateQuery in this case, unless you explicitly call them
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload<FlightsInvolvingCountryItem>, undefined> {

        return { result: { items:[], nextPage: null } }
    }
}
`