// ITEMS
const Country: string = "Country"
const Flight: string = "Flight"
const Airplane: string = "Airplane"
const Airport: string = "Airport"
const Tourist: string = "Tourist"
const AirplaneManifacturer: string = "AirplaneManifacturer"
const AirplaneModel: string = "AirplaneModel"
const TouristSeason: string = "TouristSeason"
const Invoice: string = "Invoice"
const Order: string = "Order"
//COMMANDS
const Proc__EraseData = "Proc__EraseData"
const Proc__TestDataGenSingleLambda = "Proc__TestDataGenSingleLambda"
const Proc__TestDataGenSingleLambdaIdmpt = "Proc__TestDataGenSingleLambdaIdmpt"
const Proc__TestDataGenMultipleLambdaIdmpt = "Proc__TestDataGenMultipleLambdaIdmpt"
const Proc__TestDataGenMultipleLambdaIdmptChunks = "Proc__TestDataGenMultipleLambdaIdmptChunks"
const Proc__TestDataGenMultipleLambda = "Proc__TestDataGenMultipleLambda"
const Proc__CreateTourists = "Proc__CreateTourists"
const Proc__GenerateInvoices = "Proc__GenerateInvoices"
// QUERIES
const FlightsInvolvingCountry = "FlightsInvolvingCountry"


export const dataModel = {
    Items: {
        Country: {
            name: { type: "string", indexed: true, unique: true },
            currency: { type: "string" },
            code: { type: "string", indexed: true, unique: true }
        },
        Airport: {
            name: { type: "string", indexed: true, unique: true },
            airport_size: { type: "number", indexed: true },
            country: { type: "string", indexed: true, ref: Country },
            branch: { type: "string", indexed: true },
            type: { type: "string", indexed: true },
            code: { type: "string", indexed: true }
        },
        Flight: {
            airplane: { type: "string", indexed: true, ref: Airplane },
            from_airport: { type: "string", indexed: true, ref: Airport },
            to_airport: { type: "string", indexed: true, ref: Airport },
            from_country: { type: "string", indexed: true, ref: Country },
            to_country: { type: "string", indexed: true, ref: Country },
            flight_code: { type: "string", indexed: true },
            duration_hours: { type: "number", indexed: true },
            tourist_season: { type: "string", indexed: true, ref: TouristSeason },
            price_1st_class: { type: "number" },
            price_2nd_class: { type: "number" },
            price_vip: { type: "number" }
        },
        Airplane: {
            reg_uq_str: { type: "string", indexed: true, unique: true },
            reg_uq_number: { type: "number", indexed: true, unique: true },
            number_of_seats: { type: "number", indexed: true },
            model: { type: "string", indexed: true, ref: AirplaneModel },
            manifacturer: { type: "string", indexed: true, ref: AirplaneManifacturer }
        },
        AirplaneModel: {
            manifacturer: { type: "string", indexed: true, ref: AirplaneManifacturer },
            country: { type: "string", ref: Country },
            name: { type: "string", indexed: true, unique: true }
        },
        AirplaneManifacturer: {
            country: { type: "string", indexed: true, ref: Country },
            name: { type: "string", indexed: true, unique: true }
        },
        Tourist: {
            fname:{type: "string", indexed: true},
            lname:{type: "string", indexed: true},
            id_card:{type: "number", indexed: true, unique: true},
            tourist_season:{type: "string", indexed: true, ref: TouristSeason},
            ticket_type:{type: "string", indexed: true},
            airplane:{type: "string", indexed: true, ref: Airplane},
            flight:{type: "string", indexed: true, ref: Flight},
            from_airport:{type: "string", indexed: true, ref: Airport},
            to_airport:{type: "string", indexed: true, ref: Airport},
            from_country:{type: "string", indexed: true, ref: Country},
            to_country:{type: "string", indexed: true, ref: Country}
        },
        TouristSeason: {
            // discounts: {
            //     vip: { type: "number"}, class_2: { type: "number"}, class_1: { type: "number"}
            // },
            code: {type: "string", indexed: true, unique: true},
            price_flight_per_hour: {type: "number"}
        },
        Invoice: {
            invoice_nr: {type: "string", indexed: true},
            card_id: {type: "string", indexed: true},
            tourist: {type: "string", indexed: true, ref: Tourist},
            lname:{type: "string"},
            fname:{type: "string"},
            address1:{type: "string"},
            address2:{type: "string"},
        },
        Order: {
            invoice: {type: "string", indexed: true, ref: Invoice},
            flight: {type: "string", indexed: true, ref: Flight},
            tourist_season: {type: "string", indexed: true, ref: TouristSeason},
            price: {type: "number"},
            quantity: {type: "number"},
            discount: {type: "number"},
            vat: {type: "number"}
        }
    },
    Commands: {
        [Proc__EraseData]: {},
        [Proc__TestDataGenSingleLambda]: {},
        [Proc__TestDataGenSingleLambdaIdmpt]: {},
        [Proc__TestDataGenMultipleLambdaIdmpt]: {},
        [Proc__TestDataGenMultipleLambdaIdmptChunks]: {},
        [Proc__TestDataGenMultipleLambda]: {},
        [Proc__CreateTourists]: {},
        [Proc__GenerateInvoices]: {}
    },
    Queries: {
        [FlightsInvolvingCountry]: {}
    }
}