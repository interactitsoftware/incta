import { DynamoItem, RefKey } from "../../BaseItemManager";
import { TestModel_Airport } from "./Airport";
import { TestModel_Flight } from "./Flight";
import { TestModel_Airplane, TestModel_AirplaneModel, TestModel_AirplaneManifacturer } from "./Airplane";
import { TestModel_Country } from "./Country";

export const TestModel_FlightRefkeys: RefKey<TestModel_Flight>[] = [
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season"},
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]
export class TestModel_FlightItem extends DynamoItem(TestModel_Flight, "flight", TestModel_FlightRefkeys) { }

export const TestModel_AirplaneRefkeys:RefKey<TestModel_Airplane>[] = [
    {key: "number_of_seats", unique:true},
    {key: "home_airport", ref:"airport"},
    {key: "country", ref: "country"},
    {key: "model", ref: "airplane|nomenclature|model"},
    {key: "manifacturer", ref: "airplane|nomenclature|manifacturer"},
]
export class TestModel_AirplaneItem extends DynamoItem(TestModel_Airplane, "airplane", TestModel_AirplaneRefkeys) { }
    
export class TestModel_AirplaneModelItem extends DynamoItem(TestModel_AirplaneModel, "airplane|nomenclature|model") { }
export class TestModel_AirplaneManifacturerItem extends DynamoItem(TestModel_AirplaneManifacturer, "airplane|nomenclature|manifacturer") { }
export class TestModel_AirportItem extends DynamoItem(TestModel_Airport, "airport") { }
export class TestModel_CountryItem extends DynamoItem(TestModel_Country, "country") { }

