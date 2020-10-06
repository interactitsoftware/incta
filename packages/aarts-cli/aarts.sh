#!/bin/bash

CLIENT_PROJECT_PATH=$(PWD)
AARTS_INFRA_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

#defaults
STACK_NAME=`printf '%s\n' "${PWD##*/}" | sed 's/[\|_0123456789]//g' | sed 's/\.//g'`
AWS_PROFILE=akrsmv
DEBUG_MODE=

#-------------------------------------------------------
#                       FUNCTIONS
#-------------------------------------------------------

deploy()
{
    windows() { [[ -n "$WINDIR" ]]; }
    if windows; then
        TARGET_BASE_PATH=$(cmd //c cd)
        cd $AARTS_INFRA_PATH
        LINK_BASE_PATH=$(cmd //c cd)
    else
        TARGET_BASE_PATH=CLIENT_PROJECT_PATH
        cd $AARTS_INFRA_PATH
        LINK_BASE_PATH=AARTS_INFRA_PATH
    fi
    
    mkdir -p $AARTS_INFRA_PATH/node-modules-layer/nodejs
    rm -fr $AARTS_INFRA_PATH/node-modules-layer/nodejs/node_modules
    $AARTS_INFRA_PATH/ln-cross-platform.sh $LINK_BASE_PATH/node-modules-layer/nodejs/node_modules $TARGET_BASE_PATH/node_modules
    
    cd $AARTS_INFRA_PATH
    
    cdk deploy -c clientAppName=$STACK_NAME -c clientAppDirName=$CLIENT_PROJECT_PATH -c debug-mode=$DEBUG_MODE --require-approval never --profile $AWS_PROFILE
    
    cd $CLIENT_PROJECT_PATH
}

usage()
{
    echo "usage: aarts deploy [[--stack-name <stack-name>] | [--profile <aws_profile>] | [--help]]"
}

cache_clean()
{
    echo cleaning up cached deploys
    rm -fr $AARTS_INFRA_PATH/cdk.out
}

interactive()
{
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


#-------------------------------------------------------
#                 SCRIPT ENTRY POINT
#-------------------------------------------------------
while [ "$1" != "" ]; do
    case $1 in
        deploy )                ACTION=DEPLOY
        ;;
        --cache-clean )         cache_clean
                                exit
        ;;
        -n | --stack-name )     shift
            STACK_NAME="$1"
        ;;
        -d | --debug-mode )     DEBUG_MODE=1
        ;;
        -i | --interactive )    interactive=1
        ;;
        -h | --help )           usage
                                exit
        ;;
        * )                     usage
                                exit
    esac
    shift
done

if [ "$interactive" = "1" ]; then
    echo "interactive is on"
    interactive
else
    echo "interactive is off"
fi


case $ACTION in
    DEPLOY )                        deploy
                                    exit
    ;;
    * )                             usage
                                    exit
esac
