import { DynamoCommandItem } from "aarts-item-manager/BaseItemManager"
export class GenerateTouristsReservations  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public touristsToCreate?: number
    public useNamesLength?: number
    public fname?: string
    public lname?: string
    public iban?: string
    public toAirport?: string
    public fromAirport?: string
    public toCountry?: string
    public fromCountry?: string
    public airplane?: string
    public flight?: string
}