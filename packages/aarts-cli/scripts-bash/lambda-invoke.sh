
#!/bin/sh
# Can be used to invoke either dispatcher(sns publisher) or handler (sqs events handler)
# One need to pass file path to sns (interface AppSyncEvent) event or SQS event respectiveley
# USING SAM local invoke approach in this script, i.e a single lambda will be spinned in docker and then terminated

AWS_PROFILE=${AWS_PROFILE:=default}
SAM=`where sam`

cdk synth --no-staging --profile $AWS_PROFILE > template.yml

mkdir -p node-modules-layer/nodejs
rm ./node-modules-layer/nodejs/node_modules
./ln-cross-platform.sh ./node-modules-layer/nodejs/node_modules ../gep/node_modules

"$SAM" local invoke `node getlambdanames $1` --event ./test-events/$2.json --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json > lambda-invoke.out 2>&1