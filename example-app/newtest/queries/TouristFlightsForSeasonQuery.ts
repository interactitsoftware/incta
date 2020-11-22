import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { TouristFlightsForSeasonItem } from "../__bootstrap/_DynamoItems"
import { AartsPayload, AartsEvent, IIdentity, IItemManager  } from "aarts-types/interfaces"
import { ppjson } from "aarts-utils"

export class TouristFlightsForSeasonQuery extends BaseDynamoItemManager<TouristFlightsForSeasonItem> {
    // Custom Queries are BaseDynamoItemManagers with overwritten query method. 
    // Code will not call validateQuery and __ValidateQuery in this case, unless you explicitly call them
    async *query(args: AartsEvent): AsyncGenerator<string, AartsPayload<TouristFlightsForSeasonItem>, undefined> {

        return { result: { items:[], nextPage: null } }
    }
}
