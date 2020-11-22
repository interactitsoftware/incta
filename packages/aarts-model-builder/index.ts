#!/usr/bin/env node
import { existsSync } from "fs"
import { join } from "path"
import { builder, DataModel } from "./model-builder"

import yargs from 'yargs'

const args = yargs(process.argv.slice(2))
  .option("app-name", { type: 'string' })
  .demandOption("app-name")
  .argv

if (!args["app-name"]) {
    throw new Error("unknown appName!")
} else {
    new Promise(async (resolve, reject) => {
        
        try {
            if (!existsSync(join(args["app-name"], "data-model.json"))){
                console.log("Cannot find " + join(args["app-name"], "data-model.json") + ". Nothing to do")
                return resolve("Cannot find " + join(args["app-name"], "data-model.json") + ". Nothing to do")
            } else {
                await builder(require(join(args["app-name"], "data-model.json")) as DataModel, args["app-name"] as string)
            }
        } catch(err) {
            reject(err)
        }
        
        resolve("Done.")
    })
}
