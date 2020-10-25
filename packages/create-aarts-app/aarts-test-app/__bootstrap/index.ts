import { DynamoItem, BaseDynamoItemManager } from "aarts-dynamodb/BaseItemManager"
import { worker } from "aarts-eb-handler"
import { feeder } from "aarts-eb-notifier"
import { controller } from "aarts-eb-dispatcher"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { dynamoEventsAggregation } from "aarts-dynamodb-events/dynamoEventsAggregation"
import { dynamoEventsCallback } from "aarts-dynamodb-events/dynamoEventsCallback"
import { CountryItem } from "./_DynamoItems"
import { AirportItem } from "./_DynamoItems"
import { FlightItem } from "./_DynamoItems"
import { AirplaneItem } from "./_DynamoItems"
import { AirplaneModelItem } from "./_DynamoItems"
import { AirplaneManifacturerItem } from "./_DynamoItems"
import { TouristItem } from "./_DynamoItems"
import { TouristSeasonItem } from "./_DynamoItems"
import { InvoiceItem } from "./_DynamoItems"
import { OrderItem } from "./_DynamoItems"
import { Proc__EraseDataItem } from "./_DynamoItems"
import { Proc__TestDataGenSingleLambdaItem } from "./_DynamoItems"
import { Proc__TestDataGenSingleLambdaIdmptItem } from "./_DynamoItems"
import { Proc__TestDataGenMultipleLambdaIdmptItem } from "./_DynamoItems"
import { Proc__TestDataGenMultipleLambdaIdmptChunksItem } from "./_DynamoItems"
import { Proc__TestDataGenMultipleLambdaItem } from "./_DynamoItems"
import { Proc__CreateTouristsItem } from "./_DynamoItems"
import { Proc__GenerateInvoicesItem } from "./_DynamoItems"
import { FlightsInvolvingCountryItem } from "./_DynamoItems"

import { CountryDomain } from "../domain/CountryDomain"
import { AirportDomain } from "../domain/AirportDomain"
import { FlightDomain } from "../domain/FlightDomain"
import { AirplaneDomain } from "../domain/AirplaneDomain"
import { AirplaneModelDomain } from "../domain/AirplaneModelDomain"
import { AirplaneManifacturerDomain } from "../domain/AirplaneManifacturerDomain"
import { TouristDomain } from "../domain/TouristDomain"
import { TouristSeasonDomain } from "../domain/TouristSeasonDomain"
import { InvoiceDomain } from "../domain/InvoiceDomain"
import { OrderDomain } from "../domain/OrderDomain"
import { Proc__EraseDataCommand } from "../commands/Proc__EraseDataCommand"
import { Proc__TestDataGenSingleLambdaCommand } from "../commands/Proc__TestDataGenSingleLambdaCommand"
import { Proc__TestDataGenSingleLambdaIdmptCommand } from "../commands/Proc__TestDataGenSingleLambdaIdmptCommand"
import { Proc__TestDataGenMultipleLambdaIdmptCommand } from "../commands/Proc__TestDataGenMultipleLambdaIdmptCommand"
import { Proc__TestDataGenMultipleLambdaIdmptChunksCommand } from "../commands/Proc__TestDataGenMultipleLambdaIdmptChunksCommand"
import { Proc__TestDataGenMultipleLambdaCommand } from "../commands/Proc__TestDataGenMultipleLambdaCommand"
import { Proc__CreateTouristsCommand } from "../commands/Proc__CreateTouristsCommand"
import { Proc__GenerateInvoicesCommand } from "../commands/Proc__GenerateInvoicesCommand"
import { FlightsInvolvingCountryQuery } from "../queries/FlightsInvolvingCountryQuery"

const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(CountryItem.__type, CountryItem)
allItems.set(AirportItem.__type, AirportItem)
allItems.set(FlightItem.__type, FlightItem)
allItems.set(AirplaneItem.__type, AirplaneItem)
allItems.set(AirplaneModelItem.__type, AirplaneModelItem)
allItems.set(AirplaneManifacturerItem.__type, AirplaneManifacturerItem)
allItems.set(TouristItem.__type, TouristItem)
allItems.set(TouristSeasonItem.__type, TouristSeasonItem)
allItems.set(InvoiceItem.__type, InvoiceItem)
allItems.set(OrderItem.__type, OrderItem)
allItems.set(Proc__EraseDataItem.__type, Proc__EraseDataItem)
allItems.set(Proc__TestDataGenSingleLambdaItem.__type, Proc__TestDataGenSingleLambdaItem)
allItems.set(Proc__TestDataGenSingleLambdaIdmptItem.__type, Proc__TestDataGenSingleLambdaIdmptItem)
allItems.set(Proc__TestDataGenMultipleLambdaIdmptItem.__type, Proc__TestDataGenMultipleLambdaIdmptItem)
allItems.set(Proc__TestDataGenMultipleLambdaIdmptChunksItem.__type, Proc__TestDataGenMultipleLambdaIdmptChunksItem)
allItems.set(Proc__TestDataGenMultipleLambdaItem.__type, Proc__TestDataGenMultipleLambdaItem)
allItems.set(Proc__CreateTouristsItem.__type, Proc__CreateTouristsItem)
allItems.set(Proc__GenerateInvoicesItem.__type, Proc__GenerateInvoicesItem)
allItems.set(FlightsInvolvingCountryItem.__type, FlightsInvolvingCountryItem)

const allItemManagers = {
    "BASE": new BaseDynamoItemManager(allItems),
    [CountryItem.__type]: new CountryDomain(allItems),
    [AirportItem.__type]: new AirportDomain(allItems),
    [FlightItem.__type]: new FlightDomain(allItems),
    [AirplaneItem.__type]: new AirplaneDomain(allItems),
    [AirplaneModelItem.__type]: new AirplaneModelDomain(allItems),
    [AirplaneManifacturerItem.__type]: new AirplaneManifacturerDomain(allItems),
    [TouristItem.__type]: new TouristDomain(allItems),
    [TouristSeasonItem.__type]: new TouristSeasonDomain(allItems),
    [InvoiceItem.__type]: new InvoiceDomain(allItems),
    [OrderItem.__type]: new OrderDomain(allItems),
    [Proc__EraseDataItem.__type]: new Proc__EraseDataCommand(allItems),
    [Proc__TestDataGenSingleLambdaItem.__type]: new Proc__TestDataGenSingleLambdaCommand(allItems),
    [Proc__TestDataGenSingleLambdaIdmptItem.__type]: new Proc__TestDataGenSingleLambdaIdmptCommand(allItems),
    [Proc__TestDataGenMultipleLambdaIdmptItem.__type]: new Proc__TestDataGenMultipleLambdaIdmptCommand(allItems),
    [Proc__TestDataGenMultipleLambdaIdmptChunksItem.__type]: new Proc__TestDataGenMultipleLambdaIdmptChunksCommand(allItems),
    [Proc__TestDataGenMultipleLambdaItem.__type]: new Proc__TestDataGenMultipleLambdaCommand(allItems),
    [Proc__CreateTouristsItem.__type]: new Proc__CreateTouristsCommand(allItems),
    [Proc__GenerateInvoicesItem.__type]: new Proc__GenerateInvoicesCommand(allItems),
    [FlightsInvolvingCountryItem.__type]: new FlightsInvolvingCountryQuery(allItems),

}
class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}
global.domainAdapter = new DomainAdapter()

export { controller, worker, feeder, dynamoEventsAggregation, dynamoEventsCallback }
