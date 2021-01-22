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

start_local_dynamodb() {
    docker network create sam-local
    docker run -ti --network sam-local --name dynamodb-local --restart always -d -v $AARTS_INFRA_PATH/dynamodblocaldata:/home/dynamodblocal/data/ -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data/
    echo Started local dynamodb image with a --restart always flag.
    echo next steps:
    echo - aws dynamodb list-tables --endpoint-url http://localhost:8000
    echo - execute aarts rebuild-model from your aarts project root folder to create a json definition for the table needed
    echo - aws dynamodb create-table --cli-input-json file://local-dev-table-def.json --endpoint-url http://localhost:8000 
    echo - you can benefit also from the provided local dynamodb shell here http://localhost:8000/shell
}

setup_local_dynamodb_table() {
    echo will create local dynamo table $STACK_NAME
}

cdk_synth() {
    cd $AARTS_INFRA_PATH
    cdk synth --no-staging -c clientAppName=$STACK_NAME -c clientAppDirName=$CLIENT_PROJECT_PATH -c debug-mode=$DEBUG_MODE --profile $AWS_PROFILE >template.yml
}

sam_invoke_worker() {
    cd $AARTS_INFRA_PATH
    echo "sam local invoke worker..."
    mkdir -p $CLIENT_PROJECT_PATH/local-lambda.out

    WORKER=$(node getlambdanames worker)

    link_client_app
    cdk_synth

    echo $(node ./node-modules-layer/nodejs/node_modules/aarts-eb-dispatcher/samLocalSimulateSQSHandler.js $CLIENT_PROJECT_PATH/$TEST_EVENT) | sam local invoke $WORKER --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json >$CLIENT_PROJECT_PATH/local-lambda.out/worker.out 2>&1
}

sam_invoke_controller() {
    cd $AARTS_INFRA_PATH
    echo "sam local invoke controller..."
    mkdir -p $CLIENT_PROJECT_PATH/local-lambda.out

    CONTROLLER=$(node getlambdanames controller)

    link_client_app
    cdk_synth

    cat $CLIENT_PROJECT_PATH/$TEST_EVENT | sam local invoke $CONTROLLER --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json >$CLIENT_PROJECT_PATH/local-lambda.out/controller.out 2>&1
}

rebuild_model() {
    cd $AARTS_INFRA_PATH
    ./node_modules/.bin/aarts-model-builder --app-path $CLIENT_PROJECT_PATH
}

aws_invoke_worker() {
    cd $AARTS_INFRA_PATH
    echo "aws lambda invoke worker..."
    mkdir -p $CLIENT_PROJECT_PATH/local-lambda.out
    WORKER=$(node getlambdanames worker)
    SQS_EVENT=$(node ./node-modules-layer/nodejs/node_modules/aarts-eb-dispatcher/samLocalSimulateSQSHandler.js $CLIENT_PROJECT_PATH/$TEST_EVENT)
    QUOTED_SQS_EVENT=\'$(echo $SQS_EVENT | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g')\'

    AWS_SAM_INVOKE='aws lambda invoke --function-name '$WORKER' --endpoint-url '\"http://localhost:3001\"' --no-verify-ssl --payload '$QUOTED_SQS_EVENT' --cli-binary-format raw-in-base64-out '$CLIENT_PROJECT_PATH'/local-lambda.out/worker.out'
    eval "$AWS_SAM_INVOKE"
}

aws_invoke_controller() {
    cd $AARTS_INFRA_PATH
    echo "aws lambda invoke controller..."
    mkdir -p $CLIENT_PROJECT_PATH/local-lambda.out
    CONTROLLER=$(node getlambdanames controller)
    QUOTED_SNS_EVENT=\'$(cat $CLIENT_PROJECT_PATH/$TEST_EVENT | sed -e ':a' -e 'N' -e '$!ba' -e 's/\n/ /g')\'

    AWS_SAM_INVOKE='aws lambda invoke --function-name '$CONTROLLER' --endpoint-url '\"http://localhost:3001\"' --no-verify-ssl --payload '$QUOTED_SNS_EVENT' --cli-binary-format raw-in-base64-out '$CLIENT_PROJECT_PATH'/local-lambda.out/controller.out'
    eval "$AWS_SAM_INVOKE"

}

start_local_lambda() {
    cd $AARTS_INFRA_PATH
    echo "sam local start-lambda..."
    mkdir -p $CLIENT_PROJECT_PATH/local-lambda.out
    # get_paths
    link_client_app
    cdk_synth
    # this is simulating a lambda environment in a docker container locally (NOTE: without the SQS/SNS, only lambda).
    sam local start-lambda --log-file $CLIENT_PROJECT_PATH/local-lambda.out/sam-lambda.out --template template.yml --region ddblocal --docker-network sam-local --env-vars env-constants-local.json
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
    cd $CLIENT_PROJECT_PATH
    if [[ -d "dist" ]]; then
        link_client_app
        cd $AARTS_INFRA_PATH
        cdk deploy -c clientAppName=$STACK_NAME -c clientAppDirName=$CLIENT_PROJECT_PATH -c debug-mode=$DEBUG_MODE --profile $AWS_PROFILE --require-approval never
        cd $CLIENT_PROJECT_PATH
    else
        echo
        echo Cannot deploy...
        echo No dist folder found. Did you forgot to build the app?
    fi
}

usage() {
    echo "deploying to AWS:                    aarts deploy [[-d | --debug][--stack-name | -n <stack-name>][--profile | -p <aws_profile>]]"
    echo "start local lambda environment:      aarts start-local-lambda"
    echo "start local dynamodb:                aarts start-local-dynamodb"
    echo "process event in local lambda env:   aarts process --test-event <test-event>"
}

clean_cache() {
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
    rebuild-model)
        ACTION=REBUILD_MODEL
        ;;
    deploy)
        ACTION=DEPLOY
        ;;
    start-local-lambda)
        ACTION=START_LOCAL_LAMBDA
        ;;
    setup-local-dynamodb-table)
        ACTION=SETUP_LOCAL_DYNAMODB_TABLE
        ;;
    start-local-dynamodb)
        ACTION=START_LOCAL_DYNAMODB
        ;;
    process) # shorthand
        ACTION=AWS_INVOKE_CONTROLLER
        ;;
    aws-invoke-controller)
        ACTION=AWS_INVOKE_CONTROLLER
        ;;
    aws-invoke-worker)
        ACTION=AWS_INVOKE_WORKER
        ;;
    sam-invoke-controller)
        ACTION=SAM_INVOKE_CONTROLLER
        ;;
    sam-invoke-worker)
        ACTION=SAM_INVOKE_WORKER
        ;;
    clean-cache)
        clean_cache
        exit
        ;;
    --stack-name | -n)
        shift
        STACK_NAME="$1"
        ;;
    --profile | -p)
        shift
        AWS_PROFILE="$1"
        ;;
    --test-event)
        shift
        TEST_EVENT="$1"
        ;;
    --debug | -d)
        DEBUG_MODE=1
        ;;
    --interactive | -i)
        interactive=1
        ;;
    --help | -h)
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
REBUILD_MODEL)
    rebuild_model
    exit
    ;;
DEPLOY)
    deploy
    exit
    ;;
START_LOCAL_LAMBDA)
    start_local_lambda
    exit
    ;;
SETUP_LOCAL_DYNAMODB_TABLE)
    setup_local_dynamodb_table
    exit
    ;;
START_LOCAL_DYNAMODB)
    start_local_dynamodb
    exit
    ;;
AWS_INVOKE_CONTROLLER)
    aws_invoke_controller
    exit
    ;;
AWS_INVOKE_WORKER)
    aws_invoke_worker
    exit
    ;;
SAM_INVOKE_CONTROLLER)
    sam_invoke_controller
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
