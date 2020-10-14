#!/usr/bin/env sh
# Can be used to call either dispatcher(sns publisher) or handler (sqs events handler)
# One need to pass file path to sns (interface AppSyncEvent) event or SQS event respectiveley
# USING AWS lambda invoke approach in this script, i.e one should have aarts-local-server.sh running beforehand

AWS_PROFILE=${AWS_PROFILE:=default}
PWD=../`pwd`
LAMBDA=`node getlambdanames $1`

EVENT=`cat $PWD/test-events/$2.json`
QUOTED_SQS_EVENT=\'`echo $EVENT | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g'`\'

AWS_LAMBDA_INVOKE='aws lambda invoke --function-name '$LAMBDA' --endpoint-url '\"http://localhost:3001\"' --no-verify-ssl --payload '$QUOTED_SQS_EVENT' --cli-binary-format raw-in-base64-out lambda-call.out'
eval "$AWS_LAMBDA_INVOKE"