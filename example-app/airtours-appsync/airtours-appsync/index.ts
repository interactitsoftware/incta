import { AirplaneManager } from "./items/Airplane"
import { AirportManager } from "./items/Airport"
import { DynamoItem, BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { handler } from "aarts-eb-handler/aartsSqsHandler"
import { handler as notifier } from "aarts-eb-notifier/aartsAppsyncNotifier"
import { handler as dispatcher } from "aarts-eb-dispatcher/aartsSnsDispatcher"
import { handler as dispatcherTester } from "aarts-eb-dispatcher-tester/aartsDispatcherStressTester"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"

import {
    AirplaneItem, CountryItem, CityItem, PilotItem, AirportItem,
    AirplaneManifacturerItem, AirplaneModelItem, FlightItem,
    TouristItem, DataImportProcedure,
    MultipleLambdaTestDataGeneratorItem,
    SingleLambdaTestDataGeneratorItem,
    EraseDataItem,
    IdmptSingleLambdaTestDataGeneratorItem,
    IdmptMultipleLambdaTestDataGeneratorItem
} from "./_DynamoItems"
import { EraseDataManager } from "./procedures/EraseData"
import { SingleLambdaTestDataGeneratorManager } from "./procedures/SingleLambdaTestDataGenerator"
import { MultipleLambdaTestDataGeneratorManager } from "./procedures/MultipleLambdaTestDataGenerator"
import { IdmptSingleLambdaTestDataGeneratorManager } from "./procedures/IdmptSingleLambdaTestDataGenerator"
import { IdmptMultipleLambdaTestDataGeneratorManager } from "./procedures/IdmptMultipleLambdaTestDataGenerator"

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
allItems.set(SingleLambdaTestDataGeneratorItem.__type, SingleLambdaTestDataGeneratorItem)
allItems.set(MultipleLambdaTestDataGeneratorItem.__type, MultipleLambdaTestDataGeneratorItem)
allItems.set(IdmptSingleLambdaTestDataGeneratorItem.__type, IdmptSingleLambdaTestDataGeneratorItem)
allItems.set(IdmptMultipleLambdaTestDataGeneratorItem.__type, IdmptMultipleLambdaTestDataGeneratorItem)
allItems.set(EraseDataItem.__type, EraseDataItem)

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
        //items
        [CityItem.__type]: new BaseDynamoItemManager(allItems),
        [PilotItem.__type]: new BaseDynamoItemManager(allItems),
        // procedures
        [SingleLambdaTestDataGeneratorItem.__type]: new SingleLambdaTestDataGeneratorManager(allItems),
        [IdmptSingleLambdaTestDataGeneratorItem.__type]: new IdmptSingleLambdaTestDataGeneratorManager(allItems),
        [IdmptMultipleLambdaTestDataGeneratorItem.__type]: new IdmptMultipleLambdaTestDataGeneratorManager(allItems),
        [MultipleLambdaTestDataGeneratorItem.__type]: new MultipleLambdaTestDataGeneratorManager(allItems),
        [EraseDataItem.__type]: new EraseDataManager(allItems)
    }
}

global.domainAdapter = new DomainAdapter()

export { dispatcher, dispatcherTester, handler, notifier }
