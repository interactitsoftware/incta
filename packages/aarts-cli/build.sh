#!/bin/sh
npm update
npm install
npm version patch
npm run build
cd dist
npm publish -m "dev update"
cd ..