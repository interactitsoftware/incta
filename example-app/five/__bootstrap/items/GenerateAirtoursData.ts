import { DynamoCommandItem } from "aarts-ddb-manager/BaseItemManager"
export class GenerateAirtoursData  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public total_events?: number
    public useNamesLength?: number
    public touristsToCreate?: number
    public on_success?: string[]
}