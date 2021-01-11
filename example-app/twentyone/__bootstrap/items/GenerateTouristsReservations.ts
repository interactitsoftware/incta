import { DynamoCommandItem } from "aarts-ddb-manager/BaseItemManager"
export class GenerateTouristsReservations  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public total_events?: number
    public noUniqueIdCardFields?: boolean
    public noUniqueIbanFields?: boolean
    public simulateErrors?: boolean
    public touristsToCreate?: number
    public useNamesLength?: number
    public fname?: string | string[]
    public lname?: string | string[]
    public iban?: string | string[]
    public toAirport?: string | string[]
    public fromAirport?: string | string[]
    public toCountry?: string | string[]
    public fromCountry?: string | string[]
    public airplane?: string | string[]
    public flight?: string | string[]
}