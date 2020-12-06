import { DynamoCommandItem } from "aarts-item-manager/BaseItemManager"
export class ConfirmTouristsReservations  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public cancelledReservations?: string[]
    public touristSeason?: string
}