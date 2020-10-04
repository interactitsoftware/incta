#!/bin/sh
AWS_PROFILE=${AWS_PROFILE:=default}
SAM=`where sam`

cdk synth --no-staging --profile $AWS_PROFILE > template.yml
"$SAM" local invoke `node getlambdanames handler` --event ./test-events/sqsHandler/$1.json --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json