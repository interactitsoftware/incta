import { DynamoItem } from "aarts-dynamodb/BaseItemManager";
import { Airport } from "./Airport";
import { Flight } from "./Flight";
import { Airplane, AirplaneModel, AirplaneManifacturer } from "./Airplane";
import { Country } from "./Country";

export class FlightItem extends DynamoItem(Flight, "flight", ["airplane", "from_airport", "to_airport", "tourist_season", "from_country", "to_country"]) { }
export class AirportItem extends DynamoItem(Airport, "airport") { }
export class CountryItem extends DynamoItem(Country, "country") { }
export class AirplaneItem extends DynamoItem(Airplane, "airplane", ["number_of_seats", "home_airport", "country", "model", "manifacturer"]) { }
export class AirplaneModelItem extends DynamoItem(AirplaneModel, "airplane|nomenclature|model") { }
export class AirplaneManifacturerItem extends DynamoItem(AirplaneManifacturer, "airplane|nomenclature|manifacturer") { }

