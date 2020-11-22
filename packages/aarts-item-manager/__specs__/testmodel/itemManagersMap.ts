
import { DynamoItem } from "aarts-dynamodb"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { 
    AirportItem,
    AirplaneItem,
    AirplaneManifacturerItem, 
    AirplaneModelItem, 
    CountryItem, 
    FlightItem, 
    TouristItem,
    TouristSeasonItem,
    InvoiceItem,
    OrderItem,
    EraseDataItem,
    _specs_DataImporterItem,
    _specs_QueryCustomItem
 } from "./_DynamoItems"
import { _specs_QueryCustomManager } from "./QueryCustom"
import { BaseDynamoItemManager } from "../../BaseItemManager"
import { _specs_DataImporterManager } from "./DataImporter"
import { _specs_AirplaneManager } from "./airplaneManager"
import { _specs_AirportManager } from "./airportManager"


const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(AirportItem.__type, AirportItem)
allItems.set(AirplaneItem.__type, AirplaneItem)
allItems.set(AirplaneManifacturerItem.__type, AirplaneManifacturerItem)
allItems.set(AirplaneModelItem.__type, AirplaneModelItem)
allItems.set(CountryItem.__type, CountryItem)
allItems.set(FlightItem.__type, FlightItem)
allItems.set(TouristItem.__type, TouristItem)
allItems.set(TouristSeasonItem.__type, TouristSeasonItem)
allItems.set(InvoiceItem.__type, InvoiceItem)
allItems.set(OrderItem.__type, OrderItem)
allItems.set(EraseDataItem.__type, EraseDataItem)
allItems.set(_specs_QueryCustomItem.__type, _specs_QueryCustomItem)
allItems.set(_specs_DataImporterItem.__type, _specs_DataImporterItem)

const allItemManagers = {
    "BASE": new BaseDynamoItemManager(allItems),
    [AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
    [AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
    [FlightItem.__type]: new BaseDynamoItemManager(allItems),
    [CountryItem.__type]: new BaseDynamoItemManager(allItems),
    [TouristItem.__type]: new BaseDynamoItemManager(allItems),
    [TouristSeasonItem.__type]: new BaseDynamoItemManager(allItems),
    [InvoiceItem.__type]: new BaseDynamoItemManager(allItems),
    [OrderItem.__type]: new BaseDynamoItemManager(allItems),
    [EraseDataItem.__type]: new BaseDynamoItemManager(allItems),
    [AirplaneItem.__type]: new _specs_AirplaneManager(allItems),
    [AirportItem.__type]: new _specs_AirportManager(allItems),
    [_specs_QueryCustomItem.__type]: new _specs_QueryCustomManager(allItems),
    [_specs_DataImporterItem.__type]: new _specs_DataImporterManager(allItems),
}
class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}

export const domainAdapter = new DomainAdapter()