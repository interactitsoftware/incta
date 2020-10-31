import * as shell from "shelljs"
import { writeFile } from "fs"
import { join } from "path"
import { builder } from "aarts-model-builder"
import { dataModelJson, jestConfigJs, packageJson, tsconfigJson } from "./templates"
import { ppjson } from "aarts-utils"

export const createApp = async (appName: string) => {
    console.log(`Creating ${appName}...`)

    const appPath = join(".", appName)
    shell.mkdir("-p", appPath)

    //#region static files
    await recordFile(appPath, "package.json", packageJson.replace(/##APP##/g, appName))
    await recordFile(appPath, "tsconfig.json", tsconfigJson)
    await recordFile(appPath, "jest.config.js", jestConfigJs)
    await recordFile(appPath, "data-model.json", ppjson(dataModelJson))
    //#endregion

    //#region install libs
    shell.exec(`cd ${appPath} && npm install @types/node @types/jest aarts-eb-handler aarts-eb-notifier aarts-eb-dispatcher aarts-types aarts-dynamodb-events aarts-dynamodb aarts-item-manager aarts-utils aws-sdk --save`)
    //#endregion

    await builder(dataModelJson, appPath)
}

const recordFile = async (dir: string, fileName: string, contents: string) => {
    return new Promise((resolve, reject) => writeFile(join(dir, fileName), contents, err => {
        if (err) return reject(err)
        return resolve(`Written ${fileName}`)
    }))
}
