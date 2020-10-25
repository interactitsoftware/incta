
import * as shell from "shelljs"
import { existsSync, readFileSync } from "fs"
import { join, sep } from "path"
import { createApp} from "../../create-app"
const outputDir = join(__dirname, "..","..","aarts-test-app")
describe('globalDefinitions.generator', () => {

  beforeEach(async (done) => {
    await shell.rm("-fr",[outputDir])
    done()
  })
 
  test('creates app folder and puts initial config files', async () => {
    console.log = jest.fn();
    await createApp(outputDir.split(sep).reverse()[0]) //="aarts-test-app"
    expect(console.log).toHaveBeenCalledWith('Creating aarts-test-app...');

    const expectedGlobalDefinitionsFilePath = join(outputDir, "package.json")
    const pkg = require(join(outputDir, "package.json"))
    expect(pkg.name).toBe("aarts-test-app")
    expect(pkg.description).toBe("aarts-test-app provisioned by aarts")

    const dirs = shell.ls(outputDir)
    expect(dirs).toContain("package.json")
    expect(dirs).toContain("package-lock.json")
    expect(dirs).toContain("tsconfig.json")
    expect(dirs).toContain("jest.config.js")

    return true
  })
})


