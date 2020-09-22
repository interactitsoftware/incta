import { DynamoItem } from "../../BaseItemManager";
import { _specs_Airport } from "./Airport";
import { _specs_Flight } from "./Flight";
import { _specs_Airplane, _specs_AirplaneModel, _specs_AirplaneManifacturer } from "./Airplane";
import { _specs_Country } from "./Country";
import { _specs_Tourist } from "./Tourist";
import { _specs_DataImporter } from "./DataImporter";
import { _specs_TouristSeason } from "./TouristSeason";
import { _specs_Invoice } from "./Invoice";
import { _specs_Order } from "./Order";

export class _specs_FlightItem extends DynamoItem(_specs_Flight, "flight", [
    {key: "flight_code", unique:true},
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season", ref: "tourist_season"},
    {key: "duration_hours"}, // although not pointing to other type, we still want to query by it
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"},
]) { }

export class _specs_TouristItem extends DynamoItem(_specs_Tourist, "tourist", [
    {key: "id_card"},
    {key: "id_card_flight", unique:true},
    {key: "fname"},
    {key: "lname"},
    {key: "airplane", ref:"airplane"},
    {key: "tourist_season", ref: "tourist_season"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "flight", ref: "flight"}, 
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"},
]) { }

export class _specs_AirplaneItem extends DynamoItem(_specs_Airplane, "airplane", [
    {key: "reg_uq_str", unique: true},
    {key: "reg_uq_number", unique: true},
    {key: "number_of_seats"},// although not pointing to other type, nor its unique - we still want to query by it
    {key: "model", ref: "airplane_model"},
    {key: "manifacturer", ref: "airplane_manifacturer"},
]) { }

export class _specs_AirportItem extends DynamoItem(_specs_Airport, "airport", [
    {key: "name", unique: true},
    {key: "country", ref: "country"},
    {key: "airport_size"},
	{key: "code"},
	{key: "branch"},
	{key: "type"},
]) { }

export class _specs_CountryItem extends DynamoItem(_specs_Country, "country", [
    {key: "name", unique: true},
    {key: "currency"},
    {key: "code"},
]) { }

export class _specs_AirplaneModelItem extends DynamoItem(_specs_AirplaneModel, "airplane_model", [
    {key: "name", unique: true},
    {key: "manifacturer", ref: "manifacturer"},
    {key: "country", ref: "country"},
]) { }

export class _specs_AirplaneManifacturerItem extends DynamoItem(_specs_AirplaneManifacturer, "airplane_manifacturer", [
    {key: "name", unique: true},
    {key: "country", ref: "country"},
]) { }

export class _specs_TouristSeasonItem extends DynamoItem(_specs_TouristSeason, "tourist_season", [
    {key: "code", unique: true}
]) { }

export class _specs_InvoiceItem extends DynamoItem(_specs_Invoice, "invoice", [
    {key: "card_id", unique: true}
]) { }

export class _specs_OrderItem extends DynamoItem(_specs_Order, "order", [
    {key: "invoice", unique: true}
]) { }

// Concept of persisting "procedures" has been removed, better would be to have this on a higher level not in this library
export class _specs_DataImporterItem extends DynamoItem(_specs_DataImporter, "airtours_test_data_importer", [
    {key: "exit_code"},
    {key: "date_started"},
]) { }

