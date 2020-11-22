#!/usr/bin/env node
import { createApp } from "./create-app"
import yargs from 'yargs'
import { builder, DataModel } from "aarts-model-builder/model-builder"

const args = yargs(process.argv.slice(2))
  .option("app-name", { type: 'string' })
  .option("template", { type: 'string' })
  .describe("app-name", "The app name to be created")
  .describe("template", "Optional template model to load (airtours | dynamo)")
  .demandOption("app-name")
  .argv

console.log("PARSED args: ", args)

Promise.all([createApp(args["app-name"], args.template)])
  .then(async (result: { dataModelJson: DataModel, appPath: string }[]) => {
    await builder(result[0].dataModelJson, result[0].appPath)
  }, err => {
    console.error(err)
  })
