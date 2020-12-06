import { DynamoItem } from "aarts-ddb";
import {
    _specs_AirplaneItem as AirplaneItem,
    _specs_AirplaneManifacturerItem as AirplaneManifacturerItem,
    _specs_AirplaneModelItem as AirplaneModelItem,
    _specs_AirportItem as AirportItem,
    _specs_CountryItem as CountryItem,
    _specs_FlightItem as FlightItem,
    _specs_TouristItem as TouristItem,
    _specs_TouristSeasonItem as TouristSeasonItem,
    _specs_InvoiceItem as InvoiceItem,
    _specs_OrderItem as OrderItem,
    _specs_EraseDataItem as EraseDataItem,
} from "aarts-ddb/__specs__/testmodel/_DynamoItems"
import { _specs_DataImporter } from "./DataImporter";
import { _specs_QueryCustom } from "./QueryCustom";
// just reuse the __specs__ test model of aarts-ddb lib. There are unit tests over it and also a procedure for seedin data, so its a good start for demo app
export {
    AirplaneItem,
    AirplaneManifacturerItem,
    AirplaneModelItem,
    AirportItem,
    CountryItem,
    FlightItem,
    TouristItem,
    TouristSeasonItem,
    InvoiceItem,
    OrderItem,
    EraseDataItem
}

// example command(procedure)
export class _specs_DataImporterItem extends DynamoItem(_specs_DataImporter, "P__AirtoursDataImporter", [
    {key: "start_date"},
]) { }
// example item, that allows for custom queries, i.e its Manager overwrites directly the query method
export class _specs_QueryCustomItem extends DynamoItem(_specs_QueryCustom, "queryCustom", []) {}

