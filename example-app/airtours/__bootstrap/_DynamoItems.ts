import { DynamoItem } from "aarts-dynamodb/DynamoItem"
import { Country } from "./items/Country"
import { Airport } from "./items/Airport"
import { Flight } from "./items/Flight"
import { Airplane } from "./items/Airplane"
import { AirplaneModel } from "./items/AirplaneModel"
import { AirplaneManifacturer } from "./items/AirplaneManifacturer"
import { Tourist } from "./items/Tourist"
import { TouristSeason } from "./items/TouristSeason"
import { Invoice } from "./items/Invoice"
import { Order } from "./items/Order"
import { EraseData } from "./items/EraseData"
import { TestDataGenerator } from "./items/TestDataGenerator"
import { CreateTourists } from "./items/CreateTourists"
import { CreateTouristsProperly } from "./items/CreateTouristsProperly"
import { DBMigration_AddCreatedIndex } from "./items/DBMigration_AddCreatedIndex"
import { DBMigration_AddCreatedIndexForAirport } from "./items/DBMigration_AddCreatedIndexForAirport"
import { GenerateInvoices } from "./items/GenerateInvoices"
import { FlightsInvolvingCountry } from "./items/FlightsInvolvingCountry"

const __type__Country: string = "Country"
const __type__Airport: string = "Airport"
const __type__Flight: string = "Flight"
const __type__Airplane: string = "Airplane"
const __type__AirplaneModel: string = "AirplaneModel"
const __type__AirplaneManifacturer: string = "AirplaneManifacturer"
const __type__Tourist: string = "Tourist"
const __type__TouristSeason: string = "TouristSeason"
const __type__Invoice: string = "Invoice"
const __type__Order: string = "Order"
const __type__FlightsInvolvingCountry: string = "FlightsInvolvingCountry"
const __type__EraseData: string = "P__EraseData"
const __type__TestDataGenerator: string = "P__TestDataGenerator"
const __type__CreateTourists: string = "P__CreateTourists"
const __type__CreateTouristsProperly: string = "P__CreateTouristsProperly"
const __type__DBMigration_AddCreatedIndex: string = "P__DBMigration_AddCreatedIndex"
const __type__DBMigration_AddCreatedIndexForAirport: string = "P__DBMigration_AddCreatedIndexForAirport"
const __type__GenerateInvoices: string = "P__GenerateInvoices"

export class CountryItem extends DynamoItem(Country, __type__Country, [
    { key:"name", unique: true },
    { key:"code", unique: true },
    { key:"date_created" },
]) { }
export class AirportItem extends DynamoItem(Airport, __type__Airport, [
    { key:"date_created" },
    { key:"name", unique: true },
    { key:"airport_size" },
    { key:"country" , ref: __type__Country},
    { key:"branch" },
    { key:"type" },
    { key:"code" },
]) { }
export class FlightItem extends DynamoItem(Flight, __type__Flight, [
    { key:"airplane" , ref: __type__Airplane},
    { key:"from_airport" , ref: __type__Airport},
    { key:"to_airport" , ref: __type__Airport},
    { key:"from_country" , ref: __type__Country},
    { key:"to_country" , ref: __type__Country},
    { key:"flight_code" },
    { key:"duration_hours" },
    { key:"tourist_season" , ref: __type__TouristSeason},
]) { }
export class AirplaneItem extends DynamoItem(Airplane, __type__Airplane, [
    { key:"reg_uq_str", unique: true },
    { key:"reg_uq_number", unique: true },
    { key:"number_of_seats" },
    { key:"model" , ref: __type__AirplaneModel},
    { key:"manifacturer" , ref: __type__AirplaneManifacturer},
]) { }
export class AirplaneModelItem extends DynamoItem(AirplaneModel, __type__AirplaneModel, [
    { key:"manifacturer" , ref: __type__AirplaneManifacturer},
    { key:"country" , ref: __type__Country},
    { key:"name", unique: true },
]) { }
export class AirplaneManifacturerItem extends DynamoItem(AirplaneManifacturer, __type__AirplaneManifacturer, [
    { key:"country" , ref: __type__Country},
    { key:"name", unique: true },
]) { }
export class TouristItem extends DynamoItem(Tourist, __type__Tourist, [
    { key:"fname" },
    { key:"lname" },
    { key:"id_card", unique: true },
    { key:"iban" },
    { key:"tourist_season" , ref: __type__TouristSeason},
    { key:"ticket_type" },
    { key:"airplane" , ref: __type__Airplane},
    { key:"flight" , ref: __type__Flight},
    { key:"from_airport" , ref: __type__Airport},
    { key:"to_airport" , ref: __type__Airport},
    { key:"from_country" , ref: __type__Country},
    { key:"to_country" , ref: __type__Country},
]) { }
export class TouristSeasonItem extends DynamoItem(TouristSeason, __type__TouristSeason, [
    { key:"code", unique: true },
]) { }
export class InvoiceItem extends DynamoItem(Invoice, __type__Invoice, [
    { key:"invoice_nr" },
    { key:"card_id" },
    { key:"tourist" , ref: __type__Tourist},
]) { }
export class OrderItem extends DynamoItem(Order, __type__Order, [
    { key:"invoice" , ref: __type__Invoice},
    { key:"flight" , ref: __type__Flight},
    { key:"tourist_season" , ref: __type__TouristSeason},
]) { }
export class EraseDataItem extends DynamoItem(EraseData, __type__EraseData, [
]) { }
export class TestDataGeneratorItem extends DynamoItem(TestDataGenerator, __type__TestDataGenerator, [
]) { }
export class CreateTouristsItem extends DynamoItem(CreateTourists, __type__CreateTourists, [
]) { }
export class CreateTouristsProperlyItem extends DynamoItem(CreateTouristsProperly, __type__CreateTouristsProperly, [
]) { }
export class DBMigration_AddCreatedIndexItem extends DynamoItem(DBMigration_AddCreatedIndex, __type__DBMigration_AddCreatedIndex, [
]) { }
export class DBMigration_AddCreatedIndexForAirportItem extends DynamoItem(DBMigration_AddCreatedIndexForAirport, __type__DBMigration_AddCreatedIndexForAirport, [
]) { }
export class GenerateInvoicesItem extends DynamoItem(GenerateInvoices, __type__GenerateInvoices, [
]) { }
export class FlightsInvolvingCountryItem extends DynamoItem(FlightsInvolvingCountry, __type__FlightsInvolvingCountry, [
]) { }
