import { DynamoItem } from "aarts-dynamodb/DynamoItem"
import { Airplane } from "./items/Airplane"
import { Airport } from "./items/Airport"
import { GenerateTouristSeasonInvoices } from "./items/GenerateTouristSeasonInvoices"
import { SendWelcomeEmail } from "./items/SendWelcomeEmail"
import { VisibleFlightsForUser } from "./items/VisibleFlightsForUser"

const __type__Airplane: string = "Airplane"
const __type__Airport: string = "Airport"
const __type__VisibleFlightsForUser: string = "VisibleFlightsForUser"
const __type__GenerateTouristSeasonInvoices: string = "P__GenerateTouristSeasonInvoices"
const __type__SendWelcomeEmail: string = "P__SendWelcomeEmail"

export class AirplaneItem extends DynamoItem(Airplane, __type__Airplane, [
    { key:"model" },
    { key:"code", unique: true },
    { key:"airport", unique: true , ref: __type__Airport},
]) { }
export class AirportItem extends DynamoItem(Airport, __type__Airport, [
    { key:"country", unique: true },
    { key:"type", unique: true },
    { key:"isPublic" },
]) { }
export class GenerateTouristSeasonInvoicesItem extends DynamoItem(GenerateTouristSeasonInvoices, __type__GenerateTouristSeasonInvoices, [
    { key:"startDate" },
    { key:"endDate" },
]) { }
export class SendWelcomeEmailItem extends DynamoItem(SendWelcomeEmail, __type__SendWelcomeEmail, [
    { key:"startDate" },
    { key:"endDate" },
]) { }
export class VisibleFlightsForUserItem extends DynamoItem(VisibleFlightsForUser, __type__VisibleFlightsForUser, [
]) { }
