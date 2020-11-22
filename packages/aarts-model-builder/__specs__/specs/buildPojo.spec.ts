
import * as shell from "shelljs"
import { builder, _indent } from "../../model-builder"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const outputDir = join(__dirname, "aarts-test-app")
describe('buildPojo', () => {

  beforeEach(async (done) => {
    await shell.rm("-fr", [outputDir])
    done()
  })

  test('writes 2 domain items as specified in input dataModel object', async () => {
    console.log = jest.fn();

    await builder({
      Items: {
        "Airport": {
          inerMap1: {
            innerProp1: { type: "string" },
            innerProp2: { type: "number" },
            innerMap2: {
              innerProp2_1: { type: "string" },
              innerProp2_2: { type: "number" },
              innerMap3: {
                innerProp3_1: { type: "string" },
                innerProp3_2: { type: "number" }
              }
            }
          },
          inerMap2: {
            innerProp2_1: { type: "string" },
            innerProp2_2: { type: "number" },
            innerMap2_2: {
              innerProp2_2_1: { type: "string" },
              innerProp2_2_2: { type: "number" },
              innerMap2_3: {
                innerProp2_3_1: { type: "string" },
                innerProp2_3_2: { type: "number" }
              }
            }
          },
          type: { type: "number" },
          isPublic: { type: "boolean" }
        }
      },
      Commands: {},
      Queries: {}
    }, outputDir)

    expect(shell.ls(outputDir)).toContain("__bootstrap")
    expect(shell.ls(join(outputDir, "__bootstrap"))).toContain("items")

    expect(existsSync(join(outputDir, "__bootstrap", "items", "Airport.ts"))).toBe(true)

    const expectedAirportPojo ="export class Airport {\n"
    + _indent + "constructor(...args: any[]) { }\n"
    + _indent + "inerMap1?: {\n"
    + _indent + _indent + "innerProp1?: string\n"
    + _indent + _indent + "innerProp2?: number\n"
    + _indent + _indent + "innerMap2?: {\n"
    + _indent + _indent + _indent + "innerProp2_1?: string\n"
    + _indent + _indent + _indent + "innerProp2_2?: number\n"
    + _indent + _indent + _indent + "innerMap3?: {\n"
    + _indent + _indent + _indent + _indent + "innerProp3_1?: string\n"
    + _indent + _indent + _indent + _indent + "innerProp3_2?: number\n"
    + _indent + _indent + _indent + "}\n"
    + _indent + _indent + "}\n"
    + _indent + "}\n"
    + _indent + "inerMap2?: {\n"
    + _indent + _indent + "innerProp2_1?: string\n"
    + _indent + _indent + "innerProp2_2?: number\n"
    + _indent + _indent + "innerMap2_2?: {\n"
    + _indent + _indent + _indent + "innerProp2_2_1?: string\n"
    + _indent + _indent + _indent + "innerProp2_2_2?: number\n"
    + _indent + _indent + _indent + "innerMap2_3?: {\n"
    + _indent + _indent + _indent + _indent + "innerProp2_3_1?: string\n"
    + _indent + _indent + _indent + _indent + "innerProp2_3_2?: number\n"
    + _indent + _indent + _indent + "}\n"
    + _indent + _indent + "}\n"
    + _indent + "}\n"
    + _indent + "type?: number\n"
    + _indent + "isPublic?: boolean\n"
    +"}"

    expect(existsSync(join(outputDir, "__bootstrap", "items", "Airport.ts"))).toBe(true)
    expect(readFileSync(join(outputDir, "__bootstrap", "items", "Airport.ts")).toString()).toBe(expectedAirportPojo)

    return true
  })
})


