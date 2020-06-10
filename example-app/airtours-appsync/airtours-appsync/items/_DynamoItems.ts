import { DynamoItem } from "aarts-dynamodb/BaseItemManager";
import { Airport } from "./Airport";
import { Flight } from "./Flight";
import { Airplane, AirplaneModel, AirplaneManifacturer } from "./Airplane";
import { Country } from "./Country";

export class FlightItem extends DynamoItem(Flight, "flight", [
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season"},
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]) { }
export class AirportItem extends DynamoItem(Airport, "airport") { }
export class CountryItem extends DynamoItem(Country, "country") { }
export class AirplaneItem extends DynamoItem(Airplane, "airplane", [
    {key: "number_of_seats", unique:true},
    {key: "home_airport", ref:"airport"},
    {key: "country", ref: "country"},
    {key: "model", ref: "airplane|nomenclature|model"},
    {key: "manifacturer", ref: "airplane|nomenclature|manifacturer"},
]) { }
    
export class AirplaneModelItem extends DynamoItem(AirplaneModel, "airplane|nomenclature|model") { }
export class AirplaneManifacturerItem extends DynamoItem(AirplaneManifacturer, "airplane|nomenclature|manifacturer") { }

