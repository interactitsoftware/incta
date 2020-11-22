import * as shell from "shelljs"
import { writeFile } from "fs"
import { join } from "path"
import { dataModelJsons, jestConfigJs, packageJson, randomNames, testSetupEnvs, testutils, tsconfigJson } from "./templates"
import { ppjson } from "aarts-utils"
import * as airtoursTemplate from "./templates-cqrs"

export const createApp = async (appName: string, templateModel?: string) => {
    if (!appName) {
        throw new Error("Invalid appName!")
    }
    if (!!templateModel && !dataModelJsons[templateModel]) {
        throw new Error(`No such template: ${templateModel}. Possible values: ${Object.keys(dataModelJsons).join(',')}`)
    }
    templateModel = templateModel || 'empty'

    console.log(`Creating ${appName}...`)

    //#region folders
    const appPath = join(".", appName)
    shell.mkdir("-p", join(appPath, "__bootstrap", "items"))
    shell.mkdir("-p", join(appPath, "__specs__", "setup"))
    shell.mkdir("-p", join(appPath, "__specs__", "specs", "domain"))
    shell.mkdir("-p", join(appPath, "__specs__", "specs", "commands"))
    shell.mkdir("-p", join(appPath, "__specs__", "specs", "queries"))
    shell.mkdir("-p", join(appPath, "__test_events", "domain"))
    shell.mkdir("-p", join(appPath, "__test_events", "commands"))
    shell.mkdir("-p", join(appPath, "__test_events", "queries"))
    shell.mkdir("-p", join(appPath, "domain"))
    shell.mkdir("-p", join(appPath, "commands"))
    shell.mkdir("-p", join(appPath, "queries"))
    //#endregion

    //#region static files
    await recordFile(join(".", appName, "__specs__", "setup"), "envVars.js", testSetupEnvs)
    await recordFile(join(".", appName, "__specs__", "specs"), "testutils.ts", testutils)
    await recordFile(appPath, "package.json", packageJson.replace(/##APP##/g, appName))
    await recordFile(appPath, "tsconfig.json", tsconfigJson)
    await recordFile(appPath, "jest.config.js", jestConfigJs)
    await recordFile(appPath, "data-model.json", ppjson(dataModelJsons[templateModel]))
    //#endregion

    //#region install libs
    shell.exec(`cd ${appPath} && npm install @types/node @types/jest aarts-eb-handler aarts-eb-notifier aarts-eb-dispatcher aarts-types aarts-dynamodb-events aarts-dynamodb aarts-item-manager aarts-utils aws-sdk --save`)
    shell.exec(`cd ${appPath} && npm install jest ts-jest -D`)
    //#endregion

    await transferAnyTemplateFiles(templateModel, appPath)

    return { dataModelJson: dataModelJsons[templateModel], appPath }
}

const transferAnyTemplateFiles = async (templateModel: string, appPath: string) => {
    switch (templateModel) {
        case "empty": return;

        case "airtours":
            await transferAirtoursTemplate(appPath);
            break;
        default: return;
    }
}

const transferAirtoursTemplate = async (appPath: string) => {
    shell.mkdir("-p", join(appPath, "commands", "random-names"))
    await recordFile(join(appPath, "commands", "random-names"), "names.ts", randomNames)

    await recordFile(join(appPath, "commands"), "EraseDataCommand.ts", airtoursTemplate.EraseDataCommand)
    await recordFile(join(appPath, "commands"), "GenerateTouristsCommand.ts", airtoursTemplate.GenerateTouristsCommand)
    await recordFile(join(appPath, "commands"), "GenerateAirtoursDataCommand.ts", airtoursTemplate.GenerateAirtoursDataCommand)
    await recordFile(join(appPath, "commands"), "GenerateInvoicesCommand.ts", airtoursTemplate.GenerateInvoicesCommand)

    await recordFile(join(appPath, "domain"), "TouristDomain.ts", airtoursTemplate.TouristDomain)
    await recordFile(join(appPath, "domain"), "InvoiceDomain.ts", airtoursTemplate.InvoiceDomain)
    await recordFile(join(appPath, "domain"), "OrderDomain.ts", airtoursTemplate.OrderDomain)

    await recordFile(join(appPath, "queries"), "FlightsInvolvingCountryQuery.ts", airtoursTemplate.FlightsInvolvingCountryQuery)
    await recordFile(join(appPath, "queries"), "TouristFlightsForSeasonQuery.ts", airtoursTemplate.TouristFlightsForSeasonQuery)
}

const recordFile = async (dir: string, fileName: string, contents: string) => {
    return new Promise((resolve, reject) => writeFile(join(dir, fileName), contents, err => {
        if (err) return reject(err)
        return resolve(`Written ${fileName}`)
    }))
}
