#!/usr/bin/env node
import { existsSync } from "fs"
import { join } from "path"
import { builder, DataModel } from "./model-builder"
export { builder, DataModel }

if (!process.argv[2]) {
    console.log("You need to specify appName: npm init aarts-app <appName>")
} else {
    new Promise(async (resolve, reject) => {
        
        try {
            if (!existsSync(join(process.argv[2], "data-model.json"))){
                console.log("Cannot find " + join(process.argv[2], "data-model.json") + ". Nothing to do")
                return resolve("Cannot find " + join(process.argv[2], "data-model.json") + ". Nothing to do")
            } else {
                await builder(require(join(process.argv[2], "data-model.json")) as DataModel, process.argv[2] as string)
            }
        } catch(err) {
            reject(err)
        }
        
        resolve("Done.")
    })
}
