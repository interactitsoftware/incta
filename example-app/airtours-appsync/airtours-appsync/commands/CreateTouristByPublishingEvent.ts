import { queryItems } from "aarts-dynamodb/dynamodb-queryItems"
import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { AartsEvent, AartsPayload } from "aarts-types/interfaces";
import { AirportItem, CountryItem, FlightItem, AirplaneItem, CreateTouristByPublishingEventItem, GenerateInvoicesItem } from "../__aarts/_DynamoItems"
import { controller} from "aarts-eb-dispatcher"

import { _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem, _specs_AirplaneItem, _specs_FlightItem, _specs_TouristItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems";
import { _specs_Airport } from "aarts-dynamodb/__specs__/testmodel/Airport";
import { _specs_Country } from "aarts-dynamodb/__specs__/testmodel/Country";
import { chunks, loginfo, ppjson } from "aarts-utils/utils";
import { AppSyncEvent } from "aarts-eb-types/aartsEBUtil";

const payloads: any[] = []
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

    private async registerForPublishing(event: AppSyncEvent) {
        payloads.push(event)
    }

    private async createItemByPublishingToSns(ringToken: string, __type: string, itemBody: Record<string, any>) {
        await this.registerForPublishing({
            "action": "create",
            "item": __type,
            "ringToken": ringToken,
            "arguments": {
                "procedure": (this as DynamoItem).id,
                ...itemBody
            },
            "identity": {
                "username": "akrsmv"
            }
        })
    }

    private async getAirport(name: string): Promise<AirportItem[] | undefined> {
        if (!!name) {
            return ((await queryItems({
                ddbIndex: "smetadata__meta",
                pk: name,
                range: 'airport}name',
                primaryKeyName: "smetadata",
                rangeKeyName: "meta"
            })).items as AirportItem[]);
        } else return undefined
        
    }
    private async getFlight(): Promise<FlightItem[] | undefined> {
        if (!!this.flightCode) {
            return ((await queryItems({
                ddbIndex: "smetadata__meta",
                pk: this.flightCode as string,
                range: 'flight}flight_code',
                primaryKeyName: "smetadata",
                rangeKeyName: "meta"
            })).items as FlightItem[]);
        } else return undefined
        
    }
    private async getCountry(name: string): Promise<CountryItem[] | undefined> {
        if (!!name) {
            return ((await queryItems({
                ddbIndex: "smetadata__meta",
                pk: name,
                range: 'country}name',
                primaryKeyName: "smetadata",
                rangeKeyName: "meta"
            })).items as CountryItem[]);
        } else return undefined
    }
    private async getAirplane(): Promise<AirplaneItem[] | undefined> {
        if (!!this.airplaneCode) {
            return ((await queryItems({
                ddbIndex: "smetadata__meta",
                pk: this.airplaneCode as string,
                range: 'airplane}reg_uq_str',
                primaryKeyName: "smetadata",
                rangeKeyName: "meta"
            })).items as AirplaneItem[]);
        } else {
            return undefined
        }
       
    }

    public async start(__type: string, args: AartsEvent) {
        this.start_date = Date.now()

        

        for (let i = 0; i < Number(this.touristsToCreate || 10); i++) {
            const flightsFound = await this.getFlight()
            const airplaneFound = await this.getAirplane()
            const fromAirportsFound = await this.getAirport(this.fromAirportName as string)
            const toAirportsFound = await this.getAirport(this.toAirportName as string)
            const fromCountriesFound = await this.getCountry(this.fromCountryName as string)
            const toCountriesFound = await this.getCountry(this.toCountryName as string)

            const touristToCreate = {
                iban: this.iban?`${this.iban}${i}`: undefined,
                fname: `${this.fname}${i}`,
                lname: `${this.lname}${i}`,
                flight: !!flightsFound && flightsFound.length>0? (flightsFound[0] as DynamoItem).id : undefined,
                airplane: !!airplaneFound && airplaneFound.length>0? (airplaneFound[0] as DynamoItem).id : undefined,
                from_airport:!!fromAirportsFound && fromAirportsFound.length>0? (fromAirportsFound[0] as DynamoItem).id : undefined,
                to_airport: !!toAirportsFound && toAirportsFound.length>0? (toAirportsFound[0] as DynamoItem).id : undefined,
                from_country: !!fromCountriesFound && fromCountriesFound.length>0? (fromCountriesFound[0] as DynamoItem).id : undefined,
                to_country: !!toCountriesFound && toCountriesFound.length>0? (toCountriesFound[0] as DynamoItem).id : undefined,
            }

            await this.createItemByPublishingToSns(args.meta.ringToken as string, _specs_TouristItem.__type, touristToCreate)

            // // todo chunk it
            // await dispatcher({
            //     "action": "create",
            //     "item": _specs_TouristItem.__type,
            //     "ringToken": args.meta.ringToken as string,
            //     "jobType": "short",
            //     "arguments": { ...touristToCreate, procedure: (this as DynamoItem).id },
            //     "identity": args.payload.identity
            // })
        }

        // we want to send all events, chunked into 25, that is why we only send them once all events are registered
        if (payloads.length > 0) {
            for (const chunk of chunks(payloads, Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25))) {
                
                await controller({
                    "action": "create",//may not be necessary here ?
                    "item": _specs_TouristItem.__type,//may not be necessary here ?
                    "jobType": "long", //may not be necessary here ?
                    "ringToken": args.meta.ringToken as string,
                    "arguments": chunk,
                    "identity": {
                        "username": "akrsmv"
                    }
                })
            }
        }


        return this
    }

}

export class CreateTouristByPublishingEventManager extends BaseDynamoItemManager<CreateTouristByPublishingEventItem> {

    async *validateStart(proc: AartsPayload<CreateTouristByPublishingEventItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        const errors: string[] = []
        proc.arguments.total_events = proc.arguments.touristsToCreate
        proc.arguments.start_date = Date.now()
        // can apply some domain logic on permissions, authorizations etc
        return proc
    }

    public onUpdate = async (__type: string, newImage: DynamoItem) => {
        !process.env.DEBUGGER || loginfo(`IN SPECIFIC OnCreate METHOD: ${ppjson(newImage)}`);
        if (!!newImage && newImage.revisions === 1 && newImage.success === true) {
            !process.env.DEBUGGER || loginfo(`WILL START GENERATE INVOICES: ${ppjson(newImage)}`);
            // if the procedure completed
            
            // do not call directly the generator, you need it in a separate lambda (+ you will need to cycle through its yields, if directly invoked)
            // (global.domainAdapter.itemManagers[GenerateInvoicesItem.__type] as unknown as IProcedure<GenerateInvoicesItem>).start(GenerateInvoicesItem.__type, {
            //     meta: {
            //         action: "start",
            //         eventSource: "worker:input:long",
            //         item: GenerateInvoicesItem.__type,
            //         ringToken: newImage.ringToken as string
            //     },
            //     payload: {
            //         arguments: {
            //             ringToken: newImage.ringToken as string
            //         },
            //         identity: {

            //         }
            //     }
            // })

            // instead publish new event
            await controller({
                "action": "start",
                "item": GenerateInvoicesItem.__type,
                "ringToken": newImage.ringToken as string,
                "jobType": "long",
                "arguments": {
                    ringToken: newImage.ringToken as string
                },
                "identity": {
                    "username": "akrsmv"
                }
            })
        } else {
            !process.env.DEBUGGER || loginfo(`onUpdate fired for ${__type} but conditions to fire next procedures were not met: ${ppjson(newImage)}`)
        }

    }

}