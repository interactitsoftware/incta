import { AirplaneManager } from "../items/Airplane"
import { AirportManager } from "../items/Airport"
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { DynamoItem } from "aarts-dynamodb"
import { worker } from "aarts-eb-handler"
import { feeder } from "aarts-eb-notifier"
import { controller } from "aarts-eb-dispatcher"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { dynamoEventsAggregation } from "aarts-dynamodb-events/dynamoEventsAggregation"
import { dynamoEventsCallback } from "aarts-dynamodb-events/dynamoEventsCallback"
import { _specs_QueryCustomItem as QueryCustomItem } from "aarts-item-manager/__specs__/testmodel/_DynamoItems"

import {
    // -- defined on a aarts-dynamodb/_specs_ level
    AirplaneItem, CountryItem, CityItem, PilotItem, AirportItem,
    AirplaneManifacturerItem, AirplaneModelItem, FlightItem,
    TouristItem, TouristSeasonItem, InvoiceItem, OrderItem, EraseDataProcedure,
    // defined in this lib
    MultipleLambdaTestDataGeneratorItem,
    SingleLambdaTestDataGeneratorItem,
    IdmptSingleLambdaTestDataGeneratorItem,
    IdmptMultipleLambdaTestDataGeneratorItem,
    IdmptChunksMultipleLambdaTestDataGeneratorItem, CreateTouristByPublishingEventItem, GenerateInvoicesItem, QueryCustom1Item
} from "./_DynamoItems"
import { SingleLambdaTestDataGeneratorManager } from "../commands/SingleLambdaTestDataGenerator"
import { MultipleLambdaTestDataGeneratorManager } from "../commands/MultipleLambdaTestDataGenerator"
import { IdmptSingleLambdaTestDataGeneratorManager } from "../commands/IdmptSingleLambdaTestDataGenerator"
import { IdmptMultipleLambdaTestDataGeneratorManager } from "../commands/IdmptMultipleLambdaTestDataGenerator"
import { IdmptChunksMultipleLambdaTestDataGeneratorManager } from "../commands/IdmptChunksMultipleLambdaTestDataGenerator"
import { CreateTouristByPublishingEventManager } from "../commands/CreateTouristByPublishingEvent"
import { _specs_TouristSeasonItem } from "aarts-dynamodb/__specs__/testmodel/_DynamoItems"
import { _specs_QueryCustomManager } from "aarts-item-manager/__specs__/testmodel/QueryCustom"
import { GenerateInvoicesManager } from "../commands/GenerateInvoices"
import { QueryCustom1Manager } from "../queries/QueryCustom1"

const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(AirportItem.__type, AirportItem)
allItems.set(AirplaneItem.__type, AirplaneItem)
allItems.set(AirplaneManifacturerItem.__type, AirplaneManifacturerItem)
allItems.set(AirplaneModelItem.__type, AirplaneModelItem)
allItems.set(CountryItem.__type, CountryItem)
allItems.set(FlightItem.__type, FlightItem)
allItems.set(TouristItem.__type, TouristItem)
allItems.set(TouristSeasonItem.__type, TouristSeasonItem)
allItems.set(InvoiceItem.__type, InvoiceItem)
allItems.set(OrderItem.__type, OrderItem)
allItems.set(CityItem.__type, CityItem)
allItems.set(PilotItem.__type, PilotItem)
allItems.set(EraseDataProcedure.__type, EraseDataProcedure)
allItems.set(SingleLambdaTestDataGeneratorItem.__type, SingleLambdaTestDataGeneratorItem)
allItems.set(MultipleLambdaTestDataGeneratorItem.__type, MultipleLambdaTestDataGeneratorItem)
allItems.set(IdmptSingleLambdaTestDataGeneratorItem.__type, IdmptSingleLambdaTestDataGeneratorItem)
allItems.set(IdmptMultipleLambdaTestDataGeneratorItem.__type, IdmptMultipleLambdaTestDataGeneratorItem)
allItems.set(IdmptChunksMultipleLambdaTestDataGeneratorItem.__type, IdmptChunksMultipleLambdaTestDataGeneratorItem)
allItems.set(CreateTouristByPublishingEventItem.__type, CreateTouristByPublishingEventItem)
allItems.set(GenerateInvoicesItem.__type, GenerateInvoicesItem)
allItems.set(QueryCustomItem.__type, QueryCustomItem)
allItems.set(QueryCustom1Item.__type, QueryCustom1Item)

const allItemManagers = {
    // taken from _specs_ in aarts-dynamodb's test model
    [AirplaneItem.__type]: new AirplaneManager(allItems),
    [AirplaneModelItem.__type]: new BaseDynamoItemManager(allItems),
    [AirplaneManifacturerItem.__type]: new BaseDynamoItemManager(allItems),
    [AirportItem.__type]: new AirportManager(allItems),
    [FlightItem.__type]: new BaseDynamoItemManager(allItems),
    [CountryItem.__type]: new BaseDynamoItemManager(allItems),
    [TouristItem.__type]: new BaseDynamoItemManager(allItems),
    [TouristSeasonItem.__type]: new BaseDynamoItemManager(allItems),
    [InvoiceItem.__type]: new BaseDynamoItemManager(allItems),
    [OrderItem.__type]: new BaseDynamoItemManager(allItems),
    [EraseDataProcedure.__type]: new BaseDynamoItemManager(allItems),
    //defined here
    //items
    [CityItem.__type]: new BaseDynamoItemManager(allItems),
    [PilotItem.__type]: new BaseDynamoItemManager(allItems),
    //commands
    [SingleLambdaTestDataGeneratorItem.__type]: new SingleLambdaTestDataGeneratorManager(allItems),
    [IdmptSingleLambdaTestDataGeneratorItem.__type]: new IdmptSingleLambdaTestDataGeneratorManager(allItems),
    [IdmptMultipleLambdaTestDataGeneratorItem.__type]: new IdmptMultipleLambdaTestDataGeneratorManager(allItems),
    [IdmptChunksMultipleLambdaTestDataGeneratorItem.__type]: new IdmptChunksMultipleLambdaTestDataGeneratorManager(allItems),
    [MultipleLambdaTestDataGeneratorItem.__type]: new MultipleLambdaTestDataGeneratorManager(allItems),
    [CreateTouristByPublishingEventItem.__type]: new CreateTouristByPublishingEventManager(allItems),
    [GenerateInvoicesItem.__type]: new GenerateInvoicesManager(allItems),
    // custom queries, defined here
    [QueryCustom1Item.__type]: new QueryCustom1Manager(allItems),
    // custom queries, defined in aarts-dynamodb
    [QueryCustomItem.__type]: new _specs_QueryCustomManager(allItems),
    

}

class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}

global.domainAdapter = new DomainAdapter()

export { controller, worker, feeder, dynamoEventsAggregation, dynamoEventsCallback }
