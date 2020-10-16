import { DynamoItem } from "aarts-dynamodb/BaseItemManager";

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
    _specs_DataImporterItem as DataImportProcedure,
    _specs_EraseDataItem as EraseDataProcedure,
    _specs_QueryCustomItem as QueryCustomItem
} from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
// just reuse the __specs__ test model of aarts-dynamodb lib. There are unit tests over it and also a procedure for seedin data, so its a good start for demo app
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
    DataImportProcedure,
    EraseDataProcedure,
    QueryCustomItem
}

// define two domain objects purely from this example app (demonstrate the whole steps needed)
import { City } from "../items/City";  // the plain js objects (domain items)
import { Pilot } from "../items/Pilot";
// define commands - i.e normal dynamo items, which have their managers implementing the start method 
import { SingleLambdaTestDataGenerator } from "../commands/SingleLambdaTestDataGenerator";
import { IdmptSingleLambdaTestDataGenerator } from "../commands/IdmptSingleLambdaTestDataGenerator";
// import { EraseData } from "../commands/EraseData";
import { MultipleLambdaTestDataGenerator } from "../commands/MultipleLambdaTestDataGenerator";
import { IdmptMultipleLambdaTestDataGenerator } from "../commands/IdmptMultipleLambdaTestDataGenerator";
import { IdmptChunksMultipleLambdaTestDataGenerator } from "../commands/IdmptChunksMultipleLambdaTestDataGenerator";
import { CreateTouristByPublishingEvent } from "../commands/CreateTouristByPublishingEvent";
import { GenerateInvoices } from "../commands/GenerateInvoices";
import { _specs_QueryCustom } from "aarts-dynamodb/__specs__/testmodel/QueryCustom";

// ----------------- items defs
export class CityItem extends DynamoItem(City, "City", [ // the dynamodb wrapper object that we deal with
    {key:"name"},
    {key: "population"},
    {key: "country", ref:"country"}
]) { }
export class PilotItem extends DynamoItem(Pilot, "Pilot", [ // the dynamodb wrapper object that we deal with
    {key:"name"},
    {key: "city", ref: "city"},
    {key: "country", ref:"country"}
]) { }  

// --------------- commands defs
export class SingleLambdaTestDataGeneratorItem extends DynamoItem(SingleLambdaTestDataGenerator, "Proc__TestDataGenSingleLambda", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class IdmptSingleLambdaTestDataGeneratorItem extends DynamoItem(IdmptSingleLambdaTestDataGenerator, "Proc__TestDataGenSingleLambdaIdmpt", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class IdmptMultipleLambdaTestDataGeneratorItem extends DynamoItem(IdmptMultipleLambdaTestDataGenerator, "Proc__TestDataGenMultipleLambdaIdmpt", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class IdmptChunksMultipleLambdaTestDataGeneratorItem extends DynamoItem(IdmptChunksMultipleLambdaTestDataGenerator, "Proc__TestDataGenMultipleLambdaIdmptChunks", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class MultipleLambdaTestDataGeneratorItem extends DynamoItem(MultipleLambdaTestDataGenerator, "Proc__TestDataGenMultipleLambda", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class CreateTouristByPublishingEventItem extends DynamoItem(CreateTouristByPublishingEvent, "Proc__CreateTourists", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class GenerateInvoicesItem extends DynamoItem(GenerateInvoices, "Proc__GenerateInvoices", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

export class QueryCustom1Item extends DynamoItem(_specs_QueryCustom, "queryCustom1", [
]) {}
