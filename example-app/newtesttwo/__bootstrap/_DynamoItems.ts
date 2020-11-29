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
import { GenerateAirtoursData } from "./items/GenerateAirtoursData"
import { GenerateTouristsReservations } from "./items/GenerateTouristsReservations"
import { ConfirmTouristsReservations } from "./items/ConfirmTouristsReservations"
import { GenerateInvoices } from "./items/GenerateInvoices"
import { FlightsInvolvingCountry } from "./items/FlightsInvolvingCountry"
import { AllTouristForTouristSeason } from "./items/AllTouristForTouristSeason"

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
const __type__AllTouristForTouristSeason: string = "AllTouristForTouristSeason"
const __type__EraseData: string = "P__EraseData"
const __type__GenerateAirtoursData: string = "P__GenerateAirtoursData"
const __type__GenerateTouristsReservations: string = "P__GenerateTouristsReservations"
const __type__ConfirmTouristsReservations: string = "P__ConfirmTouristsReservations"
const __type__GenerateInvoices: string = "P__GenerateInvoices"

export class CountryItem extends DynamoItem(Country, __type__Country, [
    { key:"name", unique: true },
    { key:"code", unique: true },
]) { }
export class AirportItem extends DynamoItem(Airport, __type__Airport, [
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
export class GenerateAirtoursDataItem extends DynamoItem(GenerateAirtoursData, __type__GenerateAirtoursData, [
]) { }
export class GenerateTouristsReservationsItem extends DynamoItem(GenerateTouristsReservations, __type__GenerateTouristsReservations, [
]) { }
export class ConfirmTouristsReservationsItem extends DynamoItem(ConfirmTouristsReservations, __type__ConfirmTouristsReservations, [
]) { }
export class GenerateInvoicesItem extends DynamoItem(GenerateInvoices, __type__GenerateInvoices, [
]) { }
export class FlightsInvolvingCountryItem extends DynamoItem(FlightsInvolvingCountry, __type__FlightsInvolvingCountry, [
]) { }
export class AllTouristForTouristSeasonItem extends DynamoItem(AllTouristForTouristSeason, __type__AllTouristForTouristSeason, [
]) { }
