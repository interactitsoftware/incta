#!/bin/sh
AARTS_HOME=`pwd`/..
echo $AARTS_HOME

echo ------------------------------------------------
echo                     BACKEND
echo ------------------------------------------------
cd $AARTS_HOME/airtours-appsync

npm update
npm install
npm version patch
npm run build

echo ------------------------------------------------
echo                     INFRA
echo ------------------------------------------------

cd $AARTS_HOME/infra

npm update
npm install
npm version patch
npm run build