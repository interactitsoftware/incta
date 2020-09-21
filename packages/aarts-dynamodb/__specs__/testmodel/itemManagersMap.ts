import { _specs_AirplaneManager } from "./Airplane"
import { _specs_AirportManager } from "./Airport"
import { DynamoItem, BaseDynamoItemManager } from "../../BaseItemManager"


import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { 
    _specs_AirportItem,
    _specs_AirplaneItem,
    _specs_AirplaneManifacturerItem, 
    _specs_AirplaneModelItem, 
    _specs_CountryItem, 
    _specs_FlightItem, 
    _specs_TouristItem,
    _specs_DataImporterItem } from "./_DynamoItems"


const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(_specs_AirportItem.__type, _specs_AirportItem)
allItems.set(_specs_AirplaneItem.__type, _specs_AirplaneItem)
allItems.set(_specs_AirplaneManifacturerItem.__type, _specs_AirplaneManifacturerItem)
allItems.set(_specs_AirplaneModelItem.__type, _specs_AirplaneModelItem)
allItems.set(_specs_CountryItem.__type, _specs_CountryItem)
allItems.set(_specs_FlightItem.__type, _specs_FlightItem)
allItems.set(_specs_TouristItem.__type, _specs_TouristItem)
allItems.set(_specs_DataImporterItem.__type, _specs_DataImporterItem)

const allItemManagers = {
    "BASE": new BaseDynamoItemManager(allItems),
    [_specs_AirplaneItem.__type]: new _specs_AirplaneManager(allItems),
    [_specs_AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_AirportItem.__type]: new _specs_AirportManager(allItems),
    [_specs_FlightItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_CountryItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_TouristItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_DataImporterItem.__type]: new BaseDynamoItemManager(allItems)
}
class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}

export const domainAdapter = new DomainAdapter()