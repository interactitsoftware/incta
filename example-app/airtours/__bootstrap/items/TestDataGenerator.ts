import { DynamoCommandItem } from "aarts-item-manager/BaseItemManager"
export class TestDataGenerator  extends DynamoCommandItem {
    constructor(...args: any[]) { super(args) }
    public useNamesLength?: number
    public touristsToCreate?: number
    public on_success?: string[]
}