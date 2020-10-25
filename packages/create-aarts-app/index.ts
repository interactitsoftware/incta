#!/usr/bin/env node
import { createApp } from "./create-app"

if (!process.argv[2]) {
    console.log("You need to specify appName: npm init aarts-app <appName>")
} else {
    new Promise(async (resolve, reject) => {
        
        try {
            await createApp(process.argv[2])
        } catch(err) {
            reject(err)
        }
        
        resolve()
    })
}
