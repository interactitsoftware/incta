import { DynamoCommandItem } from "aarts-item-manager/BaseItemManager"
export class CreateTourists  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public touristsToCreate?: number
    public fname?: string
    public lname?: string
    public toAirportName?: string
    public fromAirportName?: string
    public toCountryName?: string
    public fromCountryName?: string
    public airplaneCode?: string
    public flightCode?: string
    public iban?: string
}