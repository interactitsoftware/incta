import * as shell from "shelljs"
import { join } from "path"
import { aartsConfig, dataModelJsons, jestConfigJs, packageJson, randomNames, testSetupEnvs, tsconfigJson } from "./templates"
import { ppjson } from "aarts-utils"
import { recordFile } from "./utils"
import { transferAirtoursV1Template } from "./templates/airtours-ddb-v1"
import { transferAirtoursV2Template } from "./templates/airtours-ddb-v2"

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
    await recordFile(appPath, "package.json", packageJson.replace(/##APP##/g, appName))
    await recordFile(appPath, "tsconfig.json", tsconfigJson)
    await recordFile(appPath, "jest.config.js", jestConfigJs)
    await recordFile(appPath, "data-model.json", ppjson(dataModelJsons.empty_v1))
    await recordFile(appPath, "aarts.config.json", aartsConfig)
    //#endregion

    await transferAnyTemplateFiles(templateModel, appPath)

    return { dataModelJson: dataModelJsons[templateModel], appPath }
}

const transferAnyTemplateFiles = async (templateModel: string, appPath: string) => {
    switch (templateModel) {
        case "empty": return;

        case "airtours-ddb-v1":
            await transferAirtoursV1Template(appPath);
            shell.exec(`cd ${appPath} && npm install @types/node @types/jest aarts-eb-handler aarts-eb-notifier aarts-eb-dispatcher aarts-types aarts-dynamodb-events aarts-dynamodb aarts-item-manager aarts-utils aws-sdk --save`)
            shell.exec(`cd ${appPath} && npm install jest ts-jest -D`)
            break;
        case "airtours-ddb-v2":
            await transferAirtoursV2Template(appPath);
            shell.exec(`cd ${appPath} && npm install @types/node @types/jest aarts-eb-handler aarts-eb-notifier aarts-eb-dispatcher aarts-types aarts-ddb-events aarts-ddb aarts-ddb-manager aarts-utils aws-sdk --save`)
            shell.exec(`cd ${appPath} && npm install jest ts-jest -D`)
            break;
        default: 
            shell.exec(`cd ${appPath} && npm install @types/node @types/jest aarts-eb-handler aarts-eb-notifier aarts-eb-dispatcher aarts-types aarts-dynamodb-events aarts-dynamodb aarts-item-manager aarts-utils aws-sdk --save`)
            shell.exec(`cd ${appPath} && npm install jest ts-jest -D`)
        return;
    }
}


