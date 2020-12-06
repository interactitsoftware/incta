import { join } from "path"
import { randomNames } from "../../templates"
import { AllTouristForTouristSeasonQuery } from "./AllTouristForTouristSeasonQuery"
import { ConfirmTouristsReservationsCommand } from "./ConfirmTouristsReservationsCommand"
import { EraseDataCommand } from "./EraseDataCommand"
import { GenerateAirtoursDataCommand } from "./GenerateAirtoursDataCommand"
import { GenerateInvoicesCommand } from "./GenerateInvoicesCommand"
import { GenerateTouristsReservationsCommand } from "./GenerateTouristsReservationsCommand"
import { InvoiceDomain } from "./InvoiceDomain"
import { OrderDomain } from "./OrderDomain"
import { TouristDomain } from "./TouristDomain"
import * as shell from "shelljs"
import { recordFile } from "../../utils"
import { ppjson } from "aarts-utils"
import { model } from "./data-model"
import { FlightsInvolvingCountryQuery } from "./FlightsInvolvingCountryQuery"


export const transferAirtoursV1Template = async (appPath: string) => {

    await recordFile(appPath, "data-model.json", ppjson(model))

    shell.mkdir("-p", join(appPath, "commands", "random-names"))
    await recordFile(join(appPath, "commands", "random-names"), "names.ts", randomNames)

    await recordFile(join(appPath, "commands"), "EraseDataCommand.ts", EraseDataCommand)
    await recordFile(join(appPath, "commands"), "GenerateTouristsReservationsCommand.ts", GenerateTouristsReservationsCommand)
    await recordFile(join(appPath, "commands"), "ConfirmTouristsReservationsCommand.ts", ConfirmTouristsReservationsCommand)
    await recordFile(join(appPath, "commands"), "GenerateAirtoursDataCommand.ts", GenerateAirtoursDataCommand)
    await recordFile(join(appPath, "commands"), "GenerateInvoicesCommand.ts", GenerateInvoicesCommand)

    await recordFile(join(appPath, "domain"), "TouristDomain.ts", TouristDomain)
    await recordFile(join(appPath, "domain"), "InvoiceDomain.ts", InvoiceDomain)
    await recordFile(join(appPath, "domain"), "OrderDomain.ts", OrderDomain)

    await recordFile(join(appPath, "queries"), "FlightsInvolvingCountryQuery.ts", FlightsInvolvingCountryQuery)
    await recordFile(join(appPath, "queries"), "AllTouristForTouristSeasonQuery.ts", AllTouristForTouristSeasonQuery)
}