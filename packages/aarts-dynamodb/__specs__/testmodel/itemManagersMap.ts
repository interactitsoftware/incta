import { TestModel_AirplaneManager } from "./Airplane"
import { TestModel_AirportManager } from "./Airport"
import { DynamoItem, BaseDynamoItemManager } from "../../BaseItemManager"


import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { 
    TestModel_AirportItem,
    TestModel_AirplaneItem,
    TestModel_AirplaneManifacturerItem, 
    TestModel_AirplaneModelItem, 
    TestModel_CountryItem, 
    TestModel_FlightItem, 
    TestModel_TouristItem } from "./_DynamoItems"


const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(TestModel_AirportItem.__type, TestModel_AirportItem)
allItems.set(TestModel_AirplaneItem.__type, TestModel_AirplaneItem)
allItems.set(TestModel_AirplaneManifacturerItem.__type, TestModel_AirplaneManifacturerItem)
allItems.set(TestModel_AirplaneModelItem.__type, TestModel_AirplaneModelItem)
allItems.set(TestModel_CountryItem.__type, TestModel_CountryItem)
allItems.set(TestModel_FlightItem.__type, TestModel_FlightItem)
allItems.set(TestModel_TouristItem.__type, TestModel_TouristItem)

class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public itemManagers = {
        [TestModel_AirplaneItem.__type]: new TestModel_AirplaneManager(allItems),
        [TestModel_AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
        [TestModel_AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
        [TestModel_AirportItem.__type]: new TestModel_AirportManager(allItems),
        [TestModel_FlightItem.__type]: new BaseDynamoItemManager(allItems),
        [TestModel_CountryItem.__type]: new BaseDynamoItemManager(allItems),
        [TestModel_TouristItem.__type]: new BaseDynamoItemManager(allItems)
    }
}

export const domainAdapter = new DomainAdapter()