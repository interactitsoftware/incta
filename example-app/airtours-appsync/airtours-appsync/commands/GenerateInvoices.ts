import { BaseDynamoItemManager, DynamoItem } from "aarts-dynamodb/BaseItemManager"
import { AartsEvent, AartsPayload, IIdentity } from "aarts-types/interfaces";
import { GenerateInvoicesItem } from "../__aarts/_DynamoItems"


import { _specs_AirplaneManifacturerItem, _specs_AirplaneModelItem, _specs_AirplaneItem, _specs_FlightItem, _specs_TouristItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems";
import { _specs_Airport } from "aarts-dynamodb/__specs__/testmodel/Airport";
import { _specs_Country } from "aarts-dynamodb/__specs__/testmodel/Country";
import { transactUpdateItem } from "aarts-dynamodb/dynamodb-transactUpdateItem";
import { versionString } from "aarts-dynamodb/DynamoDbClient";
import { MixinConstructor } from "aarts-types/Mixin";


export class GenerateInvoices {

    public total_events: number = 0
    public processed_events?: number = 0

    public succsess?: number
    public error?: number
    
    public start_date?: number
    public end_date?: number

    public ringToken?: string

    // private async getTouristFlights(): Promise<AirplaneItem[] | undefined> {
    //     if (!!this.airplaneCode) {
    //         return ((await queryItems({
    //             ddbIndex: "smetadata__meta",
    //             pk: this.airplaneCode as string,
    //             range: 'airplane}reg_uq_str',
    //             primaryKeyName: "smetadata",
    //             rangeKeyName: "meta"
    //         })).items as AirplaneItem[]);
    //     } else {
    //         return undefined
    //     }
       
    // }

    public async start(__type: string, args: AartsEvent) {

        console.log("==== Generate invoices started ====, ringToken passed is " + this.ringToken)
        

        return this
    }

}

export class GenerateInvoicesManager extends BaseDynamoItemManager<GenerateInvoicesItem> {

    async *validateStart(proc: AartsPayload<GenerateInvoicesItem>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        const errors: string[] = []
        proc.arguments.total_events = proc.arguments.touristsToCreate
        proc.arguments.start_date = Date.now()
        // can apply some domain logic on permissions, authorizations etc
        return proc
    }

    public onCreate = async (__type: string, newImage: DynamoItem) => {
        console.log("ON CREATE IN GENERATE INVOICES")
        // immediatley say it succeeded
        await transactUpdateItem(
            newImage,
            {
                end_date: Date.now(),
                success: true,
                revisions: 0,
                ringToken: newImage.ringToken,
                id: newImage.id,
                meta: `${versionString(0)}|${newImage.id.substr(0, newImage.id.indexOf("|"))}`
            },
            (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
    }


}