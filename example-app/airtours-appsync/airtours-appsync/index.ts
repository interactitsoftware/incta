import { AirplaneManager } from "./items/Airplane"
import { AirportManager } from "./items/Airport"
import { DynamoItem, BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { handler } from "aarts-eb-handler/aartsSqsHandler"
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { handler as dispatcherTester } from "aarts-eb-dispatcher-tester/aartsDispatcherStressTester"
import { handler as notifier } from "aarts-eb-notifier/aartsAppsyncNotifier"

import {
    AirplaneItem,
    AirplaneManifacturerItem,
    AirplaneModelItem,
    FlightItem,
    AirportItem,
    CountryItem
} from "./items/_DynamoItems"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"


const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(AirplaneItem.__type, AirplaneItem)
allItems.set(AirplaneModelItem.__type, AirplaneModelItem)
allItems.set(AirplaneManifacturerItem.__type, AirplaneManifacturerItem)
allItems.set(AirportItem.__type, AirportItem)
allItems.set(FlightItem.__type, FlightItem)
allItems.set(CountryItem.__type, CountryItem)

class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public itemManagers = {
        [AirplaneItem.__type]: new AirplaneManager(allItems),
        [AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
        [AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
        [AirportItem.__type]: new AirportManager(allItems),
        [FlightItem.__type]: new BaseDynamoItemManager(allItems),
        [CountryItem.__type]: new BaseDynamoItemManager(allItems)
    }
}

global.domainAdapter = new DomainAdapter()

export {handler, dispatcher, dispatcherTester, notifier}