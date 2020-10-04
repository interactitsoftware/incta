#!/usr/bin/env sh
AWS_PROFILE=${AWS_PROFILE:=default}
SAM=`where sam`
HANDLER=`node getlambdanames handler`

cdk synth --no-staging --profile $AWS_PROFILE > template.yml

mkdir -p node-modules-layer/nodejs
rm ./node-modules-layer/nodejs/node_modules
./ln-cross-platform.sh ./node-modules-layer/nodejs/node_modules ../gep/node_modules

# this is simulating a lambda environment in a docker container locally (NOTE: without the SQS/SNS, only lambda).
"$SAM" local start-lambda --log-file sam-lambda-service.out --template template.yml --region ddblocal --docker-network sam-local --env-vars env-constants-local.json

# important on calling lambda from another lambda, in sam local environment
# https://github.com/awslabs/aws-sam-cli/issues/510#issuecomment-554687309