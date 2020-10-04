#!/usr/bin/env sh
#
# Invokes sqs handler, but expects sns event
# In here the sns event gets transformed to sqs message and the sqs handler is called with it 
#
AWS_PROFILE=${AWS_PROFILE:=default}
SAM=`where sam`
HANDLER=`node getlambdanames handler`
EVENT_FILE_PATH=`pwd`/test-events/sns/$1.json

cdk synth --no-staging --profile $AWS_PROFILE > template.yml

mkdir -p node-modules-layer/nodejs
rm ./node-modules-layer/nodejs/node_modules
./ln-cross-platform.sh ./node-modules-layer/nodejs/node_modules ../airtours-appsync/node_modules

echo `node ./node-modules-layer/nodejs/node_modules/aarts-eb-dispatcher/samLocalSimulateSQSHandler.js $EVENT_FILE_PATH` | "$SAM" local invoke $HANDLER  --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json > sqsHandler-invoke.out 2>&1