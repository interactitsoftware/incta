
import * as shell from "shelljs"
import { builder } from "../../model-builder"
import { readFileSync } from "fs"
import { join } from "path"

const outputDir = join(__dirname, "aarts-test-app")
describe('_DynamoItems.generator', () => {

  beforeEach(async (done) => {
    await shell.rm("-fr",[outputDir])
    done()
  })

  test('writes _DynamoItems.ts for 2 domain items without any relations and indexes', async () => {
    console.log = jest.fn();

    await builder({
      version:1,
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
      Queries: {},
      GSIs:[]
    }, outputDir)

    expect(console.log).toHaveBeenCalledWith(`...Generating globalDefinitions: ${join(__dirname, "aarts-test-app", "__bootstrap", "globalDefinitions.ts")}`);
    
    expect(readFileSync(join(outputDir, "__bootstrap", "_DynamoItems.ts")).toString()).toBe(
    `import { DynamoItem } from "aarts-dynamodb/DynamoItem"` + "\n"
    + `import { Airplane } from "./items/Airplane"` + "\n"
    + `import { Airport } from "./items/Airport"` + "\n"
    + `` + "\n"
    + `const __type__Airplane: string = "Airplane"` + "\n"
    + `const __type__Airport: string = "Airport"` + "\n"
    + `` + "\n"
    + `export class AirplaneItem extends DynamoItem(Airplane, __type__Airplane, [` + "\n"
    + `]) { }` + "\n"
    + `export class AirportItem extends DynamoItem(Airport, __type__Airport, [` + "\n"
    + `]) { }` + "\n")

    return true
  })

  test('writes _DynamoItems.ts for 2 domain items that have relations and indexes', async () => {
    console.log = jest.fn();

    await builder({
      version:1,
      Items:{
        "Airplane": {
          model: {type:"string", indexed: true},
          code: {type:"number", unique: true, indexed: true},
          airport: {type:"string", unique: true, indexed: true, ref: "Airport"}
        },
        "Airport": {
          country: {type:"string", unique: true, indexed: true}, // ref: "Country": TODO test whether will throw error because of inconsistent model (no Country defined)
          type: {type:"number", unique: true},
          isPublic: {type: "boolean", indexed: true}
        }
      },
      Commands:{},
      Queries: {},
      GSIs:[]
    }, outputDir)

    expect(console.log).toHaveBeenCalledWith(`...Generating globalDefinitions: ${join(__dirname, "aarts-test-app", "__bootstrap", "globalDefinitions.ts")}`);
    expect(console.log).toHaveBeenCalledWith(`Analysing model`);
    expect(console.log).toHaveBeenCalledWith(`...Generating POJO object for Airplane: ${join(__dirname, "aarts-test-app", "__bootstrap", "items", "Airplane.ts")}`);
    expect(console.log).toHaveBeenCalledWith(`...Generating test event for Airplane domain: ${join(__dirname, "aarts-test-app", "__test_events", "domain", "Airplane-create.json")}`);
    expect(console.log).toHaveBeenCalledWith(`...Generating test event for Airplane domain: ${join(__dirname, "aarts-test-app", "__test_events", "domain", "Airplane-update.json")}`);
    
    expect(console.log).toHaveBeenCalledWith(`...Generating POJO object for Airport: ${join(__dirname, "aarts-test-app", "__bootstrap", "items", "Airport.ts")}`);
    expect(console.log).toHaveBeenCalledWith(`...Generating test event for Airport domain: ${join(__dirname, "aarts-test-app", "__test_events", "domain", "Airport-create.json")}`);
    expect(console.log).toHaveBeenCalledWith(`...Generating test event for Airport domain: ${join(__dirname, "aarts-test-app", "__test_events", "domain", "Airport-update.json")}`);

    expect(console.log).toHaveBeenCalledWith(`...Generating generic test event - delete of domain item: ${join(__dirname, "aarts-test-app", "__test_events", "delete.json")}`);
    expect(console.log).toHaveBeenCalledWith(`...Generating generic test event - get domain items: ${join(__dirname, "aarts-test-app", "__test_events", "get.json")}`);
    expect(console.log).toHaveBeenCalledWith(`...Generating generic test event - query for domain item: ${join(__dirname, "aarts-test-app", "__test_events", "query.json")}`);
    
    expect(console.log).toHaveBeenCalledWith(`...Generating _DynamoItems.ts: ${join(__dirname, "aarts-test-app", "__bootstrap", "_DynamoItems.ts")}`);
   
    expect(readFileSync(join(outputDir, "__bootstrap", "_DynamoItems.ts")).toString()).toBe(
    `import { DynamoItem } from "aarts-dynamodb/DynamoItem"` + "\n"
    + `import { Airplane } from "./items/Airplane"` + "\n"
    + `import { Airport } from "./items/Airport"` + "\n"
    + `` + "\n"
    + `const __type__Airplane: string = "Airplane"` + "\n"
    + `const __type__Airport: string = "Airport"` + "\n"
    + `` + "\n"
    + `export class AirplaneItem extends DynamoItem(Airplane, __type__Airplane, [` + "\n"
    + `    { key:"model" },` + "\n"
    + `    { key:"code", unique: true },` + "\n"
    + `    { key:"airport", unique: true , ref: __type__Airport},` + "\n"
    + `]) { }` + "\n"
    + `export class AirportItem extends DynamoItem(Airport, __type__Airport, [` + "\n"
    + `    { key:"country", unique: true },` + "\n"
    + `    { key:"type", unique: true },` + "\n"
    + `    { key:"isPublic" },` + "\n"
    + `]) { }` + "\n")

    return true
  })
})


