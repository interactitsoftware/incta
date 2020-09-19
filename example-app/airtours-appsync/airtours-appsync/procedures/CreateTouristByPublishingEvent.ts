import { queryItems } from "aarts-dynamodb/dynamodb-queryItems"
import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { AartsEvent, AartsPayload, IIdentity } from "aarts-types/interfaces";
import { AirportItem, CountryItem, FlightItem, AirplaneItem, CreateTouristByPublishingEventItem } from "../_DynamoItems"
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"

import { _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem, _specs_AirplaneItem, _specs_FlightItem, _specs_TouristItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems";
import { _specs_Airport } from "aarts-dynamodb/__specs__/testmodel/Airport";
import { _specs_Country } from "aarts-dynamodb/__specs__/testmodel/Country";


export class CreateTouristByPublishingEvent {

    public total_events: number = 0
    public processed_events?: number = 0

    public succsess?: number
    public error?: number
    
    public start_date?: number
    public end_date?: number

    public touristsToCreate?: number
    public fname?: string
    public lname?: string
    public toAirportName?: string
    public fromAirportName?: string
    public toCountryName?: string
    public fromCountryName?: string
    public airplaneCode?: string
    public flightCode?: string
    public iban?: string

    private async getAirport(name: string): Promise<AirportItem> {
        return ((await queryItems({
            ddbIndex: "smetadata__meta",
            pk: name,
            range: 'airport}name',
            primaryKeyName: "smetadata",
            rangeKeyName: "meta"
        })).items as AirportItem[])[0];
    }
    private async getFlight(): Promise<FlightItem> {
        return ((await queryItems({
            ddbIndex: "smetadata__meta",
            pk: this.flightCode as string,
            range: 'flight}flight_code',
            primaryKeyName: "smetadata",
            rangeKeyName: "meta"
        })).items as FlightItem[])[0];
    }
    private async getCountry(name: string): Promise<CountryItem> {
        return ((await queryItems({
            ddbIndex: "smetadata__meta",
            pk: name,
            range: 'country}name',
            primaryKeyName: "smetadata",
            rangeKeyName: "meta"
        })).items as CountryItem[])[0];
    }
    private async getAirplane(): Promise<AirplaneItem> {
        return ((await queryItems({
            ddbIndex: "smetadata__meta",
            pk: this.airplaneCode as string,
            range: 'airplane}reg_uq_str',
            primaryKeyName: "smetadata",
            rangeKeyName: "meta"
        })).items as AirplaneItem[])[0];
    }

    public async start(__type: string, args: AartsEvent) {
        this.start_date = Date.now()

        for (let i = 0; i < Number(this.touristsToCreate || 10); i++) {
            this.total_events++ // or could just say this.total_events = this.touristsToCreate, as in this procedure we are only creating tourists requested
            const touristToCreate = {
                iban: `${this.iban}${i}`,
                fname: `${this.fname}${i}`,
                lname: `${this.lname}${i}`,
                flight: (await this.getFlight()).id,
                airplane: (await this.getAirplane()).id,
                from_airport: (await this.getAirport(this.fromAirportName as string)).id,
                to_airport: (await this.getAirport(this.toAirportName as string)).id,
                from_country: (await this.getCountry(this.fromCountryName as string)).id,
                to_country: (await this.getCountry(this.toCountryName as string)).id,
            }

            await dispatcher({
                "action": "create",
                "item": _specs_TouristItem.__type,
                "ringToken": args.meta.ringToken as string,
                "jobType": "short",
                "arguments": { ...touristToCreate, procedure: (this as DynamoItem).id },
                "identity": args.payload.identity
            })
        }

        return this
    }

}

export class CreateTouristByPublishingEventManager extends BaseDynamoItemManager<CreateTouristByPublishingEventItem> {

    async *validateStart(proc: AartsPayload<CreateTouristByPublishingEventItem>): AsyncGenerator<string, AartsPayload, undefined> {
        const errors: string[] = []
        // can apply some domain logic on permissions, authorizations etc
        return proc
    }

}