#!/usr/bin/env sh
#
# Invokes sns handler, expects sns event
#

AWS_PROFILE=${AWS_PROFILE:=default}
SAM=`where sam`
DISPATCHER=`node getlambdanames dispatcher`
EVENT_FILE_PATH=`pwd`/test-events/sns/$1.json

cdk synth --no-staging --profile $AWS_PROFILE > template.yml

mkdir -p node-modules-layer/nodejs
rm ./node-modules-layer/nodejs/node_modules
./ln-cross-platform.sh ./node-modules-layer/nodejs/node_modules ../airtours-appsync/node_modules

cat $EVENT_FILE_PATH | "$SAM" local invoke $DISPATCHER  --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json > snsDispatcher-invoke.out 2>&1