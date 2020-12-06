
import * as shell from "shelljs"
import { builder } from "../../model-builder"
import { join } from "path"

const outputDir = join(__dirname, "aarts-test-app")
describe('index.generator', () => {

  beforeEach(async (done) => {
    await shell.rm("-fr",[outputDir])
    done()
  })

  test('writes intex.ts that will make use of items, _DynamoItems.ts, itemManagers and the aarts libs', async () => {
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
          country: {type:"string", unique: true, indexed: true}, // ref: "Country": TODO test/code to throw error because of inconsistent model (no Country defined)
          type: {type:"number", unique: true},
          isPublic: {type: "boolean", indexed: true}
        }
      },
      Commands:{
        "GenerateTouristSeasonInvoices" : {
          startDate: {type: "string", indexed: true},
          endDate: {type: "string", indexed: true}
        },
        "SendWelcomeEmail" : {
          startDate: {type: "string", indexed: true},
          endDate: {type: "string", indexed: true}
        }
      },
      Queries: {
        "VisibleFlightsForUser": {
          country: { type: "string" },
          touristSeason: { type: "string" },
          tourist: { type: "string" }
        }
      },
      GSIs:[]
    }, outputDir)

    expect(shell.ls(outputDir)).toContain("__bootstrap")
    expect(shell.ls(join(outputDir, "__bootstrap"))).toContain("index.ts")
 
    return true
  })

// TODO test contents of index.ts
})


