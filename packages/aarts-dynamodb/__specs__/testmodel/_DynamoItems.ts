import { DynamoItem, RefKey } from "../../BaseItemManager";
import { TestModel_Airport } from "./Airport";
import { TestModel_Flight } from "./Flight";
import { TestModel_Airplane, TestModel_AirplaneModel, TestModel_AirplaneManifacturer } from "./Airplane";
import { TestModel_Country } from "./Country";
import { TestModel_Tourist } from "./Tourist";

export const TestModel_FlightRefkeys: RefKey<TestModel_Flight>[] = [
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season"}, // although not pointing to other type, we still want to query by it
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]
export class TestModel_FlightItem extends DynamoItem(TestModel_Flight, "flight", TestModel_FlightRefkeys) { }


export const TestModel_TouristRefkeys: RefKey<TestModel_Tourist>[] = [
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "flight", ref: "flight"}, 
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]
export class TestModel_TouristItem extends DynamoItem(TestModel_Tourist, "tourist", TestModel_TouristRefkeys) { }

export const TestModel_AirplaneRefkeys:RefKey<TestModel_Airplane>[] = [
    {key: "reg_uq_str", unique: true},
    {key: "reg_uq_number", unique: true},
    {key: "number_of_seats"},// although not pointing to other type, we still want to query by it
    {key: "model", ref: "airplane|nomenclature|model"},
    {key: "manifacturer", ref: "airplane|nomenclature|manifacturer"},
]
export class TestModel_AirplaneItem extends DynamoItem(TestModel_Airplane, "airplane", TestModel_AirplaneRefkeys) { }

export const TestModel_AirportRefkeys:RefKey<TestModel_Airport>[] = [
    {key: "country", ref: "country"}
]
export class TestModel_AirportItem extends DynamoItem(TestModel_Airport, "airport", TestModel_AirportRefkeys) { }


export class TestModel_AirplaneModelItem extends DynamoItem(TestModel_AirplaneModel, "airplane|nomenclature|model") { }
export class TestModel_AirplaneManifacturerItem extends DynamoItem(TestModel_AirplaneManifacturer, "airplane|nomenclature|manifacturer") { }
export class TestModel_CountryItem extends DynamoItem(TestModel_Country, "country") { }

