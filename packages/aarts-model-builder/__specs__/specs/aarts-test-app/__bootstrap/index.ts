import { DynamoItem } from "aarts-dynamodb/DynamoItem"
import { BaseDynamoItemManager } from "aarts-item-manager/BaseItemManager"
import { worker } from "aarts-eb-handler"
import { feeder } from "aarts-eb-notifier"
import { controller } from "aarts-eb-dispatcher"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { dynamoEventsAggregation } from "aarts-dynamodb-events/dynamoEventsAggregation"
import { dynamoEventsCallback } from "aarts-dynamodb-events/dynamoEventsCallback"
import { AirplaneItem } from "./_DynamoItems"
import { AirportItem } from "./_DynamoItems"
import { GenerateTouristSeasonInvoicesItem } from "./_DynamoItems"
import { SendWelcomeEmailItem } from "./_DynamoItems"
import { VisibleFlightsForUserItem } from "./_DynamoItems"

import { AirplaneDomain } from "../domain/AirplaneDomain"
import { AirportDomain } from "../domain/AirportDomain"
import { GenerateTouristSeasonInvoicesCommand } from "../commands/GenerateTouristSeasonInvoicesCommand"
import { SendWelcomeEmailCommand } from "../commands/SendWelcomeEmailCommand"
import { VisibleFlightsForUserQuery } from "../queries/VisibleFlightsForUserQuery"

const allItems = new Map<string, AnyConstructor<DynamoItem>>()
allItems.set(AirplaneItem.__type, AirplaneItem)
allItems.set(AirportItem.__type, AirportItem)
allItems.set(GenerateTouristSeasonInvoicesItem.__type, GenerateTouristSeasonInvoicesItem)
allItems.set(SendWelcomeEmailItem.__type, SendWelcomeEmailItem)
allItems.set(VisibleFlightsForUserItem.__type, VisibleFlightsForUserItem)

const allItemManagers = {
    "BASE": new BaseDynamoItemManager(allItems),
    [AirplaneItem.__type]: new AirplaneDomain(allItems),
    [AirportItem.__type]: new AirportDomain(allItems),
    [GenerateTouristSeasonInvoicesItem.__type]: new GenerateTouristSeasonInvoicesCommand(allItems),
    [SendWelcomeEmailItem.__type]: new SendWelcomeEmailCommand(allItems),
    [VisibleFlightsForUserItem.__type]: new VisibleFlightsForUserQuery(allItems),

}
class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}
global.domainAdapter = new DomainAdapter()

export { controller, worker, feeder, dynamoEventsAggregation, dynamoEventsCallback }
