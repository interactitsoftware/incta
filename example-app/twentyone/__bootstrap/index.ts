import { DynamoItem } from "aarts-ddb/DynamoItem"
import { BaseDynamoItemManager } from "aarts-ddb-manager/BaseItemManager"
import { worker } from "aarts-eb-handler"
import { feeder } from "aarts-eb-notifier"
import { controller } from "aarts-eb-dispatcher"
import { IDomainAdapter } from "aarts-types/interfaces"
import { AnyConstructor } from "aarts-types/Mixin"
import { dynamoEventsAggregation } from "aarts-ddb-events/dynamoEventsAggregation"
import { dynamoEventsCallback } from "aarts-ddb-events/dynamoEventsCallback"
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
import { EraseDataItem } from "./_DynamoItems"
import { GenerateAirtoursDataItem } from "./_DynamoItems"
import { GenerateTouristsReservationsItem } from "./_DynamoItems"
import { ConfirmTouristsReservationsItem } from "./_DynamoItems"
import { GenerateInvoicesItem } from "./_DynamoItems"
import { FlightsInvolvingCountryItem } from "./_DynamoItems"
import { AllTouristForTouristSeasonItem } from "./_DynamoItems"

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
import { EraseDataCommand } from "../commands/EraseDataCommand"
import { GenerateAirtoursDataCommand } from "../commands/GenerateAirtoursDataCommand"
import { GenerateTouristsReservationsCommand } from "../commands/GenerateTouristsReservationsCommand"
import { ConfirmTouristsReservationsCommand } from "../commands/ConfirmTouristsReservationsCommand"
import { GenerateInvoicesCommand } from "../commands/GenerateInvoicesCommand"
import { FlightsInvolvingCountryQuery } from "../queries/FlightsInvolvingCountryQuery"
import { AllTouristForTouristSeasonQuery } from "../queries/AllTouristForTouristSeasonQuery"

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
allItems.set(EraseDataItem.__type, EraseDataItem)
allItems.set(GenerateAirtoursDataItem.__type, GenerateAirtoursDataItem)
allItems.set(GenerateTouristsReservationsItem.__type, GenerateTouristsReservationsItem)
allItems.set(ConfirmTouristsReservationsItem.__type, ConfirmTouristsReservationsItem)
allItems.set(GenerateInvoicesItem.__type, GenerateInvoicesItem)
allItems.set(FlightsInvolvingCountryItem.__type, FlightsInvolvingCountryItem)
allItems.set(AllTouristForTouristSeasonItem.__type, AllTouristForTouristSeasonItem)

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
    [EraseDataItem.__type]: new EraseDataCommand(allItems),
    [GenerateAirtoursDataItem.__type]: new GenerateAirtoursDataCommand(allItems),
    [GenerateTouristsReservationsItem.__type]: new GenerateTouristsReservationsCommand(allItems),
    [ConfirmTouristsReservationsItem.__type]: new ConfirmTouristsReservationsCommand(allItems),
    [GenerateInvoicesItem.__type]: new GenerateInvoicesCommand(allItems),
    [FlightsInvolvingCountryItem.__type]: new FlightsInvolvingCountryQuery(allItems),
    [AllTouristForTouristSeasonItem.__type]: new AllTouristForTouristSeasonQuery(allItems),

}
class DomainAdapter implements IDomainAdapter<DynamoItem> {
    public lookupItems = allItems
    public itemManagers = allItemManagers
    public itemManagerCallbacks = allItemManagers
}
global.domainAdapter = new DomainAdapter()
export const domainAdapter = global.domainAdapter

export { controller, worker, feeder, dynamoEventsAggregation, dynamoEventsCallback }
