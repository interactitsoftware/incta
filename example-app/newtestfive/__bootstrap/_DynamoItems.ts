import { DynamoItem } from "aarts-ddb/DynamoItem"
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
    { key:"name", unique: true  , gsiKey: ["sPK1"]},
    { key:"code", unique: true  , gsiKey: ["sPK2"]},
]) { }
export class AirportItem extends DynamoItem(Airport, __type__Airport, [
    { key:"name", unique: true  , gsiKey: ["sPK1"]},
    { key:"airport_size"  , gsiKey: ["nSK1"]},
    { key:"country"  , ref: __type__Country, gsiKey: ["sPK2"]},
    { key:"branch"  , gsiKey: ["sPK3"]},
    { key:"type"  , gsiKey: ["sPK4"]},
    { key:"code"  , gsiKey: ["sPK5"]},
]) { }
export class FlightItem extends DynamoItem(Flight, __type__Flight, [
    { key:"airplane"  , ref: __type__Airplane, gsiKey: ["sPK1"]},
    { key:"from_airport"  , ref: __type__Airport, gsiKey: ["sPK2"]},
    { key:"to_airport"  , ref: __type__Airport, gsiKey: ["sPK3"]},
    { key:"from_country"  , ref: __type__Country, gsiKey: ["sPK4"]},
    { key:"to_country"  , ref: __type__Country, gsiKey: ["sPK5"]},
    { key:"flight_code", unique: true  , gsiKey: ["sPK6"]},
    { key:"duration_hours"  , gsiKey: ["nSK1"]},
    { key:"tourist_season"  , ref: __type__TouristSeason, gsiKey: ["sPK7"]},
]) { }
export class AirplaneItem extends DynamoItem(Airplane, __type__Airplane, [
    { key:"reg_uq_str", unique: true  , gsiKey: ["sPK1"]},
    { key:"reg_uq_number", unique: true  , gsiKey: ["nSK1"]},
    { key:"number_of_seats"  , gsiKey: ["nSK2"]},
    { key:"model"  , ref: __type__AirplaneModel, gsiKey: ["sPK2"]},
    { key:"manifacturer"  , ref: __type__AirplaneManifacturer, gsiKey: ["sPK3"]},
]) { }
export class AirplaneModelItem extends DynamoItem(AirplaneModel, __type__AirplaneModel, [
    { key:"manifacturer"  , ref: __type__AirplaneManifacturer, gsiKey: ["sPK1"]},
    { key:"country"  , ref: __type__Country},
    { key:"name", unique: true  , gsiKey: ["sPK2"]},
]) { }
export class AirplaneManifacturerItem extends DynamoItem(AirplaneManifacturer, __type__AirplaneManifacturer, [
    { key:"country"  , ref: __type__Country, gsiKey: ["sPK1"]},
    { key:"name", unique: true  , gsiKey: ["sPK2"]},
]) { }
export class TouristItem extends DynamoItem(Tourist, __type__Tourist, [
    { key:"fname"  , gsiKey: ["sPK1"]},
    { key:"lname"  , gsiKey: ["sPK2"]},
    { key:"id_card", unique: true  , gsiKey: ["nPK1"]},
    { key:"iban", unique: true , required: true , gsiKey: ["sPK3"]},
    { key:"tourist_season"  , ref: __type__TouristSeason, gsiKey: ["sPK4"]},
    { key:"ticket_type"  , gsiKey: ["sPK5"]},
    { key:"airplane"  , ref: __type__Airplane, gsiKey: ["sPK6"]},
    { key:"flight"  , ref: __type__Flight, gsiKey: ["sPK7"]},
    { key:"from_airport"  , ref: __type__Airport, gsiKey: ["sPK8"]},
    { key:"to_airport"  , ref: __type__Airport, gsiKey: ["sPK9"]},
    { key:"from_country"  , ref: __type__Country, gsiKey: ["sPK10"]},
    { key:"to_country"  , ref: __type__Country, gsiKey: ["sPK11"]},
]) { }
export class TouristSeasonItem extends DynamoItem(TouristSeason, __type__TouristSeason, [
    { key:"code", unique: true  , gsiKey: ["sPK1"]},
]) { }
export class InvoiceItem extends DynamoItem(Invoice, __type__Invoice, [
    { key:"invoice_nr"  , gsiKey: ["sPK1"]},
    { key:"id_card"  , gsiKey: ["sPK2"]},
    { key:"tourist"  , ref: __type__Tourist, gsiKey: ["sPK3"]},
]) { }
export class OrderItem extends DynamoItem(Order, __type__Order, [
    { key:"invoice"  , ref: __type__Invoice, gsiKey: ["sPK1"]},
    { key:"flight"  , ref: __type__Flight, gsiKey: ["sPK2"]},
    { key:"tourist_season"  , ref: __type__TouristSeason, gsiKey: ["sPK3"]},
]) { }
export class EraseDataItem extends DynamoItem(EraseData, __type__EraseData, [
]) { }
export class GenerateAirtoursDataItem extends DynamoItem(GenerateAirtoursData, __type__GenerateAirtoursData, [
    { key:"total_events"  , gsiKey: ["nSK1"]},
]) { }
export class GenerateTouristsReservationsItem extends DynamoItem(GenerateTouristsReservations, __type__GenerateTouristsReservations, [
    { key:"total_events"  , gsiKey: ["nSK1"]},
]) { }
export class ConfirmTouristsReservationsItem extends DynamoItem(ConfirmTouristsReservations, __type__ConfirmTouristsReservations, [
    { key:"total_events"  , gsiKey: ["nSK1"]},
]) { }
export class GenerateInvoicesItem extends DynamoItem(GenerateInvoices, __type__GenerateInvoices, [
    { key:"total_events"  , gsiKey: ["nSK1"]},
]) { }
export class FlightsInvolvingCountryItem extends DynamoItem(FlightsInvolvingCountry, __type__FlightsInvolvingCountry, [
]) { }
export class AllTouristForTouristSeasonItem extends DynamoItem(AllTouristForTouristSeason, __type__AllTouristForTouristSeason, [
]) { }
