import { DynamoItem } from "aarts-dynamodb/DynamoItem"
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
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
import { Proc__EraseData } from "./items/Proc__EraseData"
import { Proc__TestDataGenSingleLambda } from "./items/Proc__TestDataGenSingleLambda"
import { Proc__TestDataGenSingleLambdaIdmpt } from "./items/Proc__TestDataGenSingleLambdaIdmpt"
import { Proc__TestDataGenMultipleLambdaIdmpt } from "./items/Proc__TestDataGenMultipleLambdaIdmpt"
import { Proc__TestDataGenMultipleLambdaIdmptChunks } from "./items/Proc__TestDataGenMultipleLambdaIdmptChunks"
import { Proc__TestDataGenMultipleLambda } from "./items/Proc__TestDataGenMultipleLambda"
import { Proc__CreateTourists } from "./items/Proc__CreateTourists"
import { Proc__GenerateInvoices } from "./items/Proc__GenerateInvoices"
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
const __type__Proc__EraseData: string = "Proc__EraseData"
const __type__Proc__TestDataGenSingleLambda: string = "Proc__TestDataGenSingleLambda"
const __type__Proc__TestDataGenSingleLambdaIdmpt: string = "Proc__TestDataGenSingleLambdaIdmpt"
const __type__Proc__TestDataGenMultipleLambdaIdmpt: string = "Proc__TestDataGenMultipleLambdaIdmpt"
const __type__Proc__TestDataGenMultipleLambdaIdmptChunks: string = "Proc__TestDataGenMultipleLambdaIdmptChunks"
const __type__Proc__TestDataGenMultipleLambda: string = "Proc__TestDataGenMultipleLambda"
const __type__Proc__CreateTourists: string = "Proc__CreateTourists"
const __type__Proc__GenerateInvoices: string = "Proc__GenerateInvoices"
const __type__FlightsInvolvingCountry: string = "FlightsInvolvingCountry"

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
export class Proc__EraseDataItem extends DynamoItem(Proc__EraseData, __type__Proc__EraseData, [
]) { }
export class Proc__TestDataGenSingleLambdaItem extends DynamoItem(Proc__TestDataGenSingleLambda, __type__Proc__TestDataGenSingleLambda, [
]) { }
export class Proc__TestDataGenSingleLambdaIdmptItem extends DynamoItem(Proc__TestDataGenSingleLambdaIdmpt, __type__Proc__TestDataGenSingleLambdaIdmpt, [
]) { }
export class Proc__TestDataGenMultipleLambdaIdmptItem extends DynamoItem(Proc__TestDataGenMultipleLambdaIdmpt, __type__Proc__TestDataGenMultipleLambdaIdmpt, [
]) { }
export class Proc__TestDataGenMultipleLambdaIdmptChunksItem extends DynamoItem(Proc__TestDataGenMultipleLambdaIdmptChunks, __type__Proc__TestDataGenMultipleLambdaIdmptChunks, [
]) { }
export class Proc__TestDataGenMultipleLambdaItem extends DynamoItem(Proc__TestDataGenMultipleLambda, __type__Proc__TestDataGenMultipleLambda, [
]) { }
export class Proc__CreateTouristsItem extends DynamoItem(Proc__CreateTourists, __type__Proc__CreateTourists, [
]) { }
export class Proc__GenerateInvoicesItem extends DynamoItem(Proc__GenerateInvoices, __type__Proc__GenerateInvoices, [
]) { }
export class FlightsInvolvingCountryItem extends DynamoItem(FlightsInvolvingCountry, __type__FlightsInvolvingCountry, [
]) { }
