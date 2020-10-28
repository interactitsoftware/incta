
import * as shell from "shelljs"
import { builder } from "../../model-builder"
import { dataModel } from "../test-model/data-model_____"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const outputDir = join(__dirname, "aarts-test-app")
describe('cqr.generator', () => {

  beforeEach(async (done) => {
    await shell.rm("-fr",[outputDir])
    done()
  })

  test('writes 2 domain items as specified in input dataModel object', async () => {
    console.log = jest.fn();

    await builder({
      Items:{
        "Airplane": {
          model: {type:"string"},
          code: {type:"number"}
        },
        "Airport": {
          country: {type:"string"},
          type: {type:"number"},
          isPublic: {type: "boolean"}
        }
      },
      Commands:{},
      Queries: {}
    }, outputDir)

    expect(shell.ls(outputDir)).toContain("__bootstrap")
    expect(shell.ls(join(outputDir, "__bootstrap"))).toContain("items")
    
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Airport.ts"))).toBe(true)
    expect(readFileSync(join(outputDir, "__bootstrap", "items", "Airport.ts")).toString()).toBe("export class Airport {\n"
    + "    constructor(...args: any[]) { }\n"
    + "    public country?: string\n"
    + "    public type?: number\n"
    + "    public isPublic?: boolean\n"
    + "}")
    
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Airplane.ts"))).toBe(true)
    expect(readFileSync(join(outputDir, "__bootstrap", "items", "Airplane.ts")).toString()).toBe("export class Airplane {\n"
    + "    constructor(...args: any[]) { }\n"
    + "    public model?: string\n"
    + "    public code?: number\n"
    + "}")
    
    return true
  })

  test.only('writes all cqr items as specified test data-model', async () => {
    // await builder(dataModel, outputDir)
    await builder(require("../test-model/MODEL"), outputDir)

    expect(shell.ls(outputDir)).toContain("__bootstrap")
    expect(shell.ls(join(outputDir, "__bootstrap"))).toContain("items")

    expect(shell.ls(join(outputDir, "__bootstrap", "items")).length).toBe(19)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Country.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Airport.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Flight.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Airplane.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "AirplaneModel.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "AirplaneManifacturer.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Tourist.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "TouristSeason.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Invoice.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "__bootstrap", "items", "Order.ts"))).toBe(true)

    expect(shell.ls(join(outputDir, "domain")).length).toBe(10)
    expect(existsSync(join(outputDir, "domain", "CountryDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "AirportDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "FlightDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "AirplaneDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "AirplaneModelDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "AirplaneManifacturerDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "TouristDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "TouristSeasonDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "InvoiceDomain.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "domain", "OrderDomain.ts"))).toBe(true)

    expect(shell.ls(join(outputDir, "commands")).length).toBe(8)
    expect(existsSync(join(outputDir, "commands", "EraseDataCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "TestDataGenSingleLambdaCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "TestDataGenSingleLambdaIdmptCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "TestDataGenMultipleLambdaIdmptCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "TestDataGenMultipleLambdaIdmptChunksCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "TestDataGenMultipleLambdaCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "CreateTouristsCommand.ts"))).toBe(true)
    expect(existsSync(join(outputDir, "commands", "GenerateInvoicesCommand.ts"))).toBe(true)

    expect(shell.ls(join(outputDir, "queries")).length).toBe(1)
    expect(existsSync(join(outputDir, "queries", "FlightsInvolvingCountryQuery.ts"))).toBe(true)
    
    return true
  })

})


