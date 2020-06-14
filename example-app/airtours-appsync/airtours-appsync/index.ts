import { AirplaneManager } from "./items/Airplane"
import { AirportManager } from "./items/Airport"
import { DynamoItem, BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { handler } from "aarts-eb-handler/aartsSqsHandler"
import { handler as notifier } from "aarts-eb-notifier/aartsAppsyncNotifier"
import { handler as dispatcher} from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { handler as dispatcherTester} from "aarts-eb-dispatcher-tester/aartsDispatcherStressTester"

import {
    _specs_AirplaneItem as AirplaneItem,
    _specs_AirplaneManifacturerItem as AirplaneManifacturerItem,
    _specs_AirplaneModelItem as AirplaneModelItem ,
    _specs_AirportItem as AirportItem,
    _specs_CountryItem as CountryItem,
    _specs_FlightItem as FlightItem,
    _specs_TouristItem as TouristItem,
    _specs_DataImporterItem as DataImportProcedure
} from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"

export class City {
  
    constructor(...args: any[]) {
        Object.assign(this, args.reduce((accum, arg)=>{
            Object.keys(arg).forEach(k => {
                accum[k] = arg[k]
            })
            return accum
        },{}))
    }

    public name?:string
    public country?: string
    public population?: number
}
export class CityItem extends DynamoItem(City, "city", [
    {key:"name"},
    {key: "population"},
    {key: "country", ref:"country"}
]) { }

export class Pilot {
  
    public name?:string
    public city?: string
    public country?: number
}
export class PilotItem extends DynamoItem(Pilot, "pilot", [
    {key:"name"},
    {key: "city", ref: "city"},
    {key: "country", ref:"country"}
]) { }


const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(AirportItem.__type, AirportItem)
allItems.set(AirplaneItem.__type, AirplaneItem)
allItems.set(AirplaneManifacturerItem.__type, AirplaneManifacturerItem)
allItems.set(AirplaneModelItem.__type, AirplaneModelItem)
allItems.set(CountryItem.__type, CountryItem)
allItems.set(FlightItem.__type, FlightItem)
allItems.set(TouristItem.__type, TouristItem)
allItems.set(CityItem.__type, CityItem)
allItems.set(PilotItem.__type, PilotItem)
allItems.set(DataImportProcedure.__type, DataImportProcedure)

class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public itemManagers = {
        // lib from specs test model
        [AirplaneItem.__type]: new AirplaneManager(allItems),
        [AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
        [AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
        [AirportItem.__type]: new AirportManager(allItems),
        [FlightItem.__type]: new BaseDynamoItemManager(allItems),
        [CountryItem.__type]: new BaseDynamoItemManager(allItems),
        [TouristItem.__type]: new BaseDynamoItemManager(allItems),
        [DataImportProcedure.__type]: new BaseDynamoItemManager(allItems),

        //defined here
        [CityItem.__type]: new BaseDynamoItemManager(allItems),
        [PilotItem.__type]: new BaseDynamoItemManager(allItems)
    }
}

global.domainAdapter = new DomainAdapter()

export {dispatcher, dispatcherTester, handler, notifier}