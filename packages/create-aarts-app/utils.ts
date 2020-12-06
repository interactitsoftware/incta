import { writeFile } from "fs"
import { join } from "path"

export const recordFile = async (dir: string, fileName: string, contents: string) => {
    return new Promise((resolve, reject) => writeFile(join(dir, fileName), contents, err => {
        if (err) return reject(err)
        return resolve(`Written ${fileName}`)
    }))
}