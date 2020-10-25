import { _specs_AirplaneManager } from "./Airplane"
import { _specs_AirportManager } from "./Airport"
import { DynamoItem } from "aarts-dynamodb"


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
    _specs_DataImporterItem,
    _specs_TouristSeasonItem,
    _specs_InvoiceItem,
    _specs_OrderItem,
    _specs_EraseDataItem,
    _specs_QueryCustomItem
 } from "./_DynamoItems"
import { _specs_QueryCustomManager } from "./QueryCustom"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { _specs_DataImporterManager } from "./DataImporter"


const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(_specs_AirportItem.__type, _specs_AirportItem)
allItems.set(_specs_AirplaneItem.__type, _specs_AirplaneItem)
allItems.set(_specs_AirplaneManifacturerItem.__type, _specs_AirplaneManifacturerItem)
allItems.set(_specs_AirplaneModelItem.__type, _specs_AirplaneModelItem)
allItems.set(_specs_CountryItem.__type, _specs_CountryItem)
allItems.set(_specs_FlightItem.__type, _specs_FlightItem)
allItems.set(_specs_TouristItem.__type, _specs_TouristItem)
allItems.set(_specs_DataImporterItem.__type, _specs_DataImporterItem)
allItems.set(_specs_TouristSeasonItem.__type, _specs_TouristSeasonItem)
allItems.set(_specs_InvoiceItem.__type, _specs_InvoiceItem)
allItems.set(_specs_OrderItem.__type, _specs_OrderItem)
allItems.set(_specs_EraseDataItem.__type, _specs_EraseDataItem)
allItems.set(_specs_QueryCustomItem.__type, _specs_QueryCustomItem)

const allItemManagers = {
    "BASE": new BaseDynamoItemManager(allItems),
    [_specs_AirplaneItem.__type]: new _specs_AirplaneManager(allItems),
    [_specs_AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_AirportItem.__type]: new _specs_AirportManager(allItems),
    [_specs_FlightItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_CountryItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_TouristItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_DataImporterItem.__type]: new _specs_DataImporterManager(allItems),
    [_specs_TouristSeasonItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_InvoiceItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_OrderItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_EraseDataItem.__type]: new BaseDynamoItemManager(allItems),
    [_specs_QueryCustomItem.__type]: new _specs_QueryCustomManager(allItems),
}
class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}

export const domainAdapter = new DomainAdapter()