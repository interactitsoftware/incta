#!/bin/sh
AARTS_HOME=`pwd`/../../..
echo $AARTS_HOME

echo ------------------------------------------------
echo            AARTS_UTILS
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-utils
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"

echo ------------------------------------------------
echo            AARTS_TYPES
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-types
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"

#npm link

echo ------------------------------------------------
echo            AARTS_EB_TYPES
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-eb-types
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"
#npm link

echo ------------------------------------------------
echo            AARTS_HANDLER
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-handler
# npm link aarts-types
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"
# npm link

echo ------------------------------------------------
echo            AARTS_EB_HANDLER
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-eb-handler
# npm link aarts-types
# npm link aarts-eb-types
# npm link aarts-handler
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"
# npm link

echo ------------------------------------------------
echo            AARTS_EB_DISPATCHER
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-eb-dispatcher
# npm link aarts-eb-types
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"
# npm link

echo ------------------------------------------------
echo            AARTS_DYNAMODB
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-dynamodb
# npm link aarts-types
npm install && npm update
npm version patch
npm run build_lin
cd dist
npm publish -m "dev update"
# npm link

echo ------------------------------------------------
echo            AARTS_EB_NOTIFIER
echo ------------------------------------------------
cd $AARTS_HOME/packages/aarts-eb-notifier
npm install && npm update
npm version patch
npm run build_lin
npm publish -m "dev update"
# npm link

# echo ------------------------------------------------
# echo            AARTS_EXAMPLE
# echo ------------------------------------------------
# cd $AARTS_HOME/example-app/airtours/airtours
# # npm link aarts-dynamodb
# # npm link aarts-handler
# npm install && npm update
# npm version patch
# npm run build_lin

# echo ------------------------------------------------
# echo            AARTS_EXAMPLE_INFRA
# echo ------------------------------------------------
# cd $AARTS_HOME/example-app/airtours/infra
# npm install && npm update
# npm version patch
# npm run build


echo ------------------------------------------------
echo            AARTS_EXAMPLE_APPSYNC
echo ------------------------------------------------
cd $AARTS_HOME/example-app/airtours-appsync/airtours-appsync
# npm link aarts-dynamodb
# npm link aarts-eb-handler
# npm link aarts-eb-notifier
# npm link aarts-eb-dispatcher
# npm link aarts-eb-dispatcher-tester
npm install && npm update
npm version patch
npm run build_lin

echo ------------------------------------------------
echo            AARTS_EXAMPLE_APPSYNC_INFRA
echo ------------------------------------------------
# cd $AARTS_HOME/example-app/airtours-appsync/infra/aarts-lambdas/dispatcher
# npm install && npm update
# cd $AARTS_HOME/example-app/airtours-appsync/infra/aarts-lambdas/dispatcher-tester
# npm install && npm update
# cd $AARTS_HOME/example-app/airtours-appsync/infra/aarts-lambdas/notifier
# npm install && npm update

cd $AARTS_HOME/example-app/airtours-appsync/infra

npm version patch
npm run build