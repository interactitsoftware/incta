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
import { _specs_EraseData } from "./EraseData";

const __type__Country: string = "Country"
const __type__Flight: string = "Flight"
const __type__Airplane: string = "Airplane"
const __type__Airport: string = "Airport"
const __type__Tourist: string = "Tourist"
const __type__AirplaneManifacturer: string = "AirplaneManifacturer"
const __type__AirplaneModel: string = "AirplaneModel"
const __type__TouristSeason: string = "TouristSeason"
const __type__Invoice: string = "Invoice"
const __type__Order: string = "Order"

export class _specs_FlightItem extends DynamoItem(_specs_Flight, __type__Flight, [
    {key: "flight_code", unique:true},
    {key: "airplane", ref:__type__Airplane},
    {key: "from_airport", ref:__type__Airport},
    {key: "to_airport", ref:__type__Airport},
    {key: "tourist_season", ref: __type__TouristSeason},
    {key: "duration_hours"}, // although not pointing to other type, we still want to query by it
    {key: "from_country", ref: __type__Country},
    {key: "to_country", ref: __type__Country},
]) { }

export class _specs_TouristItem extends DynamoItem(_specs_Tourist, __type__Tourist, [
    {key: "id_card"},
    {key: "id_card_flight", unique:true},
    {key: "fname"},
    {key: "lname"},
    {key: "airplane", ref:__type__Airplane},
    {key: "tourist_season", ref: __type__TouristSeason},
    {key: "from_airport", ref:__type__Airport},
    {key: "to_airport", ref:__type__Airport},
    {key: "flight", ref: __type__Flight}, 
    {key: "from_country", ref: __type__Country},
    {key: "to_country", ref: __type__Country},
]) { }

export class _specs_AirplaneItem extends DynamoItem(_specs_Airplane, "Airplane", [
    {key: "reg_uq_str", unique: true},
    {key: "reg_uq_number", unique: true},
    {key: "number_of_seats"},// although not pointing to other type, nor its unique - we still want to query by it
    {key: "model", ref: __type__AirplaneModel},
    {key: "manifacturer", ref: __type__AirplaneManifacturer},
]) { }

export class _specs_AirportItem extends DynamoItem(_specs_Airport, __type__Airport, [
    {key: "name", unique: true},
    {key: "country", ref: __type__Country},
    {key: "airport_size"},
	{key: "code"},
	{key: "branch"},
	{key: "type"},
]) { }

export class _specs_CountryItem extends DynamoItem(_specs_Country, __type__Country, [
    {key: "name", unique: true},
    {key: "currency"},
    {key: "code"},
]) { }

export class _specs_AirplaneModelItem extends DynamoItem(_specs_AirplaneModel, __type__AirplaneModel, [
    {key: "name", unique: true},
    {key: "manifacturer", ref: __type__AirplaneManifacturer},
    {key: "country", ref: __type__Country},
]) { }

export class _specs_AirplaneManifacturerItem extends DynamoItem(_specs_AirplaneManifacturer, __type__AirplaneManifacturer, [
    {key: "name", unique: true},
    {key: "country", ref: __type__Country},
]) { }

export class _specs_TouristSeasonItem extends DynamoItem(_specs_TouristSeason, __type__TouristSeason, [
    {key: "code", unique: true}
]) { }

export class _specs_InvoiceItem extends DynamoItem(_specs_Invoice, __type__Invoice, [
    {key: "card_id", unique: true}
]) { }

export class _specs_OrderItem extends DynamoItem(_specs_Order, __type__Order, [
    {key: "invoice", unique: true}
]) { }

// Concept of persisting "procedures" has been removed, better would be to have this on a higher level not in this library - OBSOLATE, procedure concept included and evolved, this particular proc is bit obsolate
export class _specs_DataImporterItem extends DynamoItem(_specs_DataImporter, "Proc__AirtoursDataImporter", [
    {key: "exit_code"},
    {key: "date_started"},
]) { }

export class _specs_EraseDataItem extends DynamoItem(_specs_EraseData, "Proc__EraseData", [
    {key: "start_date"},
    {key: "end_date"},
]) {}

