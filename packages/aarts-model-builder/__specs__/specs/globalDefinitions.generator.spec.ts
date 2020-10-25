
import * as shell from "shelljs"
import { builder } from "../../model-builder"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
const outputDir = join(__dirname, "aarts-test-app")
describe('globalDefinitions.generator', () => {

  beforeEach(async (done) => {
    await shell.rm("-fr",[outputDir])
    done()
  })
 
  test('writes globalDefinitions.ts file', async () => {
    console.log = jest.fn();
    await builder(undefined, outputDir)
    expect(console.log).toHaveBeenCalledWith('Model passed is undefined. Skiping items generation');

    const aartsFolderName = "__bootstrap"
    const expectedAatrtsFolderPath = join(outputDir, aartsFolderName)
    const expectedGlobalDefinitionsFilePath = join(expectedAatrtsFolderPath, "globalDefinitions.ts")

    const dirs = shell.ls(outputDir)
    expect(dirs).toContain(aartsFolderName)
    expect(existsSync(expectedGlobalDefinitionsFilePath)).toBe(true)
    expect(readFileSync(expectedGlobalDefinitionsFilePath).toString()).toBe("declare module NodeJS {"
    + "    interface Global {"
    + "    domainAdapter: any"
    + "    }"
    + "}")

    return true
  })
})


