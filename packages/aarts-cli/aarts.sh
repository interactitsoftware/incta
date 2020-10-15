#!/bin/bash

CLIENT_PROJECT_PATH=$(pwd)
AARTS_INFRA_PATH="$(realpath "$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"/"$(dirname "$(readlink "$0")")")"

echo AARTS_INFRA_PATH=$AARTS_INFRA_PATH
echo CLIENT_PROJECT_PATH=$CLIENT_PROJECT_PATH

#defaults
STACK_NAME=$(printf '%s\n' "${PWD##*/}" | sed 's/[\|_0123456789]//g' | sed 's/\.//g')
AWS_PROFILE=${AWS_PROFILE:=akrsmv}
DEBUG_MODE=

#-------------------------------------------------------
#                       FUNCTIONS
#-------------------------------------------------------

ln_cross_platform() {
    windows() { [[ -n "$WINDIR" ]]; }
    if [[ -z "$2" ]]; then
        # Link-checking mode.
        if windows; then
            echo Link-checking mode: WINDOWS
            fsutil reparsepoint query "$1" >/dev/null
        else
            [[ -L "$1" ]]
        fi
    else
        # Link-creation mode.
        if windows; then
            echo Link-creation mode: windows
            # Windows needs to be told if it's a directory or not. Infer that.
            # Also: note that we convert `/` to `\`. In this case it's necessary.
            if [[ -d "$2" ]]; then
                cmd <<<"mklink /D /J \"$1\" \"${2//\//\\}\\"" > /dev/null
        else
            cmd <<< "mklink \"$1\" \"${2//\//\\}\\"" >/dev/null
            fi
        else
            # You know what? I think ln's parameters are backwards.
            ln -s "$2" "$1"
        fi
    fi
}

cdk_synth() {
    cd $AARTS_INFRA_PATH
    cdk synth --no-staging -c clientAppName=$STACK_NAME -c clientAppDirName=$CLIENT_PROJECT_PATH -c debug-mode=$DEBUG_MODE --profile $AWS_PROFILE >template.yml
}

sam_invoke_worker() {
    cd $AARTS_INFRA_PATH
    echo sam_invoke_worker

    HANDLER=$(node getlambdanames handler)
    
    link_client_app
    cdk_synth
    
    echo $(node ./node-modules-layer/nodejs/node_modules/aarts-eb-dispatcher/samLocalSimulateSQSHandler.js $CLIENT_PROJECT_PATH/$TEST_EVENT) | sam local invoke $HANDLER --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json > $CLIENT_PROJECT_PATH/sqsHandler-invoke.out 2>&1
}

sam_invoke_handler() {
    cd $AARTS_INFRA_PATH
    echo sam_invoke_handler

    DISPATCHER=$(node getlambdanames dispatcher)
    
    link_client_app
    cdk_synth
    
    cat $CLIENT_PROJECT_PATH/$TEST_EVENT | sam local invoke $DISPATCHER --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json >$CLIENT_PROJECT_PATH/snsDispatcher-invoke.out 2>&1
}

aws_invoke_worker() {
    cd $AARTS_INFRA_PATH
    echo aws_invoke_worker
    HANDLER=$(node getlambdanames handler)
    SQS_EVENT=$(node ./node-modules-layer/nodejs/node_modules/aarts-eb-dispatcher/samLocalSimulateSQSHandler.js $CLIENT_PROJECT_PATH/$TEST_EVENT)
    QUOTED_SQS_EVENT=\'$(echo $SQS_EVENT | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g')\'

    AWS_SAM_INVOKE='aws lambda invoke --function-name '$HANDLER' --endpoint-url '\"http://localhost:3001\"' --no-verify-ssl --payload '$QUOTED_SQS_EVENT' --cli-binary-format raw-in-base64-out '$CLIENT_PROJECT_PATH'/sqsHandler-call.out'
    eval "$AWS_SAM_INVOKE"
}

aws_invoke_handler() {
    cd $AARTS_INFRA_PATH
    echo aws_invoke_handler
    DISPATCHER=$(node getlambdanames dispatcher)
    QUOTED_SNS_EVENT=\'$(cat $CLIENT_PROJECT_PATH/$TEST_EVENT | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g')\'

    AWS_SAM_INVOKE='aws lambda invoke --function-name '$DISPATCHER' --endpoint-url '\"http://localhost:3001\"' --no-verify-ssl --payload '$QUOTED_SNS_EVENT' --cli-binary-format raw-in-base64-out '$CLIENT_PROJECT_PATH'/snsDispatcher-call.out'
    eval "$AWS_SAM_INVOKE"

}

sam_start_lambda() {
    cd $AARTS_INFRA_PATH
    echo "sam local start-lambda..."
    # get_paths
    link_client_app
    cdk_synth
    # this is simulating a lambda environment in a docker container locally (NOTE: without the SQS/SNS, only lambda).
    sam local start-lambda --log-file sam-lambda-service.out --template template.yml --region ddblocal --docker-network sam-local --env-vars env-constants-local.json
    # important on calling lambda from another lambda, in sam local environment
    # https://github.com/awslabs/aws-sam-cli/issues/510#issuecomment-554687309
}

link_client_app() {
    mkdir -p $AARTS_INFRA_PATH/node-modules-layer/nodejs
    rm -fr $AARTS_INFRA_PATH/node-modules-layer/nodejs/node_modules

    # ln_cross_platform $AARTS_INFRA_PATH/node-modules-layer/nodejs/node_modules $CLIENT_PROJECT_PATH/node_modules

    # NOTE: ideally, we would do the above line, however, because of issues with symlink / docker, instead of using symlink, a full copy of node_modules is being made (still works fast enough)
    # https://github.com/aws/aws-sam-cli/issues/756
    # https://github.com/aws/aws-sam-cli/issues/1481 (closed in favor of the above)
    cp -R $CLIENT_PROJECT_PATH/node_modules $AARTS_INFRA_PATH/node-modules-layer/nodejs/node_modules
}

deploy() {
    # get_paths
    link_client_app
    cd $AARTS_INFRA_PATH
    cdk deploy -c clientAppName=$STACK_NAME -c clientAppDirName=$CLIENT_PROJECT_PATH -c debug-mode=$DEBUG_MODE --profile $AWS_PROFILE --require-approval never
    cd $CLIENT_PROJECT_PATH
}

usage() {
    echo "usage: aarts deploy [[--stack-name <stack-name>] | [--profile <aws_profile>] | [--help]]"
}

cache_clean() {
    echo cleaning up cached deploys
    rm -fr $AARTS_INFRA_PATH/cdk.out
}

interactive() {
    if [ "$interactive" = "1" ]; then

        response=

        read -p "Enter name of AWS stack name to use [$STACK_NAME] > " response
        if [ -n "$response" ]; then
            STACK_NAME="$response"
        fi

        response=

        read -p "Enter name of AWS profile to use [$AWS_PROFILE] > " response
        if [ -n "$response" ]; then
            AWS_PROFILE="$response"
        fi
    fi

}
#-----------------------------------------------------
#                 ENTRY POINT
#-------------------------------------------------------
while [ "$1" != "" ]; do
    case $1 in
    deploy)
        ACTION=DEPLOY
        ;;
    sam-start-lambda)
        ACTION=SAM_START_LAMBDA
        ;;
    aws-invoke-handler)
        ACTION=AWS_INVOKE_HANDLER
        ;;
    aws-invoke-worker)
        ACTION=AWS_INVOKE_WORKER
        ;;
    sam-invoke-handler)
        ACTION=SAM_INVOKE_HANDLER
        ;;
    sam-invoke-worker)
        ACTION=SAM_INVOKE_WORKER
        ;;
    --cache-clean)
        cache_clean
        exit
        ;;
    -n | --stack-name)
        shift
        STACK_NAME="$1"
        ;;
    --profile)
        shift
        AWS_PROFILE="$1"
        ;;
    --test-event)
        shift
        TEST_EVENT="$1"
        ;;
    -d | --debug-mode)
        DEBUG_MODE=1
        ;;
    -i | --interactive)
        interactive=1
        ;;
    -h | --help)
        usage
        exit
        ;;
    *)
        usage
        exit
        ;;
    esac
    shift
done

if [ "$interactive" = "1" ]; then
    echo "interactive is on"
    interactive
else
    echo "interactive is off"
fi

if [ "$DEBUG_MODE" = "1" ]; then
    echo "debugging is on"
    interactive
else
    echo "debugging is off"
fi

case $ACTION in
DEPLOY)
    deploy
    exit
    ;;
SAM_START_LAMBDA)
    sam_start_lambda
    exit
    ;;
AWS_INVOKE_HANDLER)
    aws_invoke_handler
    exit
    ;;
AWS_INVOKE_WORKER)
    aws_invoke_worker
    exit
    ;;
SAM_INVOKE_HANDLER)
    sam_invoke_handler
    exit
    ;;
SAM_INVOKE_WORKER)
    sam_invoke_worker
    exit
    ;;
*)
    usage
    exit
    ;;
esac
