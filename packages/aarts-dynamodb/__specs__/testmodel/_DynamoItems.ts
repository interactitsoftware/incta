import { DynamoItem, RefKey } from "../../BaseItemManager";
import { _specs_Airport } from "./Airport";
import { _specs_Flight } from "./Flight";
import { _specs_Airplane, _specs_AirplaneModel, _specs_AirplaneManifacturer } from "./Airplane";
import { _specs_Country } from "./Country";
import { _specs_Tourist } from "./Tourist";
import { _specs_DataImporter } from "./DataImporter";

export class _specs_FlightItem extends DynamoItem(_specs_Flight, "flight", [
    {key: "flight_code", unique:true},
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season"}, // although not pointing to other type, we still want to query by it
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]) { }

export class _specs_TouristItem extends DynamoItem(_specs_Tourist, "tourist", [
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "flight", ref: "flight"}, 
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]) { }

export class _specs_AirplaneItem extends DynamoItem(_specs_Airplane, "airplane", [
    {key: "reg_uq_str", unique: true},
    {key: "reg_uq_number", unique: true},
    {key: "number_of_seats"},// although not pointing to other type, we still want to query by it
    {key: "model", ref: "airplane|nomenclature|model"},
    {key: "manifacturer", ref: "airplane|nomenclature|manifacturer"},
]) { }

export class _specs_AirportItem extends DynamoItem(_specs_Airport, "airport", [
    {key: "country", ref: "country"},
    {key: "name", unique: true}
]) { }

export class _specs_CountryItem extends DynamoItem(_specs_Country, "country", [
    {key: "name", unique: true}
]) { }

export class _specs_AirplaneModelItem extends DynamoItem(_specs_AirplaneModel, "airplane|nomenclature|model", [
    {key: "manifacturer", ref: "manifacturer"}
]) { }

export class _specs_AirplaneManifacturerItem extends DynamoItem(_specs_AirplaneManifacturer, "airplane|nomenclature|manifacturer", [
    {key: "country", ref: "country"}
]) { }

export class _specs_DataImporterItem extends DynamoItem(_specs_DataImporter, "airtours|data_importer", [
    {key: "exit_code"},
    {key: "date_started"}
]) {}

