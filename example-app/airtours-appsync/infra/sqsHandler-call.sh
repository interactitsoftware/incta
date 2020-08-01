#!/usr/bin/env sh
# Can be used to call only the sqs handler lambda 
# One need to pass file path to a sns event json (interface AppSyncEvent) and it will be transformed to the right sqs format
# USING AWS LAMBDA INVOKE approach in this script, i.e one should have sam-lambda-service.sh running beforehand (i.e the sam start-lambda)

AWS_PROFILE=${AWS_PROFILE:=default}
PWD=`pwd`
SAM=`where sam`
HANDLER=`node getlambdanames handler`

SNS_EVENT_FILE_PATH=`pwd`/test-events/sns/$1.json
SQS_EVENT=`node ./node-modules-layer/nodejs/node_modules/aarts-eb-dispatcher/samLocalSimulateHandler.js $SNS_EVENT_FILE_PATH`
QUOTED_SQS_EVENT=\'`echo $SQS_EVENT | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g'`\'

AWS_SAM_INVOKE='aws lambda invoke --function-name '$HANDLER' --endpoint-url '\"http://localhost:3001\"' --no-verify-ssl --payload '$QUOTED_SQS_EVENT' --cli-binary-format raw-in-base64-out sqsHandler-call.out'
eval "$AWS_SAM_INVOKE"
