import { DynamoCommandItem } from "aarts-item-manager/BaseItemManager"
export class GenerateTouristSeasonInvoices  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public startDate?: string
    public endDate?: string
}