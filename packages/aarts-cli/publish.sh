#!/bin/sh
AARTS_HOME=`pwd`/../..
echo $AARTS_HOME

buildandpublish_aarts_utils()
{
    echo ------------------------------------------------
    echo            AARTS_UTILS
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-utils
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    
}
buildandpublish_aarts_types()
{
    echo ------------------------------------------------
    echo            AARTS_TYPES
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-types
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    
    #npm link
}

buildandpublish_aarts_eb_types()
{
    echo ------------------------------------------------
    echo            AARTS_EB_TYPES
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-eb-types
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    #npm link
}

buildandpublish_aarts_dynamodb()
{
    echo ------------------------------------------------
    echo            AARTS_DYNAMODB
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-dynamodb
    # npm link aarts-types
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    # npm link
}
buildandpublish_aarts_dynamodb_events()
{
    echo ------------------------------------------------
    echo            AARTS_DYNAMODB_EVENTS
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-dynamodb-events
    # npm link aarts-eb-types
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    # npm link
}
buildandpublish_aarts_handler()
{
    echo ------------------------------------------------
    echo            AARTS_HANDLER
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-handler
    # npm link aarts-types
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    # npm link
}
buildandpublish_aarts_eb_handler()
{
    echo ------------------------------------------------
    echo            AARTS_EB_HANDLER
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-eb-handler
    # npm link aarts-types
    # npm link aarts-eb-types
    # npm link aarts-handler
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    # npm link
}
buildandpublish_aarts_eb_dispatcher()
{
    echo ------------------------------------------------
    echo            AARTS_EB_DISPATCHER
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-eb-dispatcher
    # npm link aarts-eb-types
    npm install && npm update
    npm version patch
    npm run build_lin
    cd dist
    npm publish -m "dev update"
    # npm link
}
buildandpublish_aarts_cli()
{
    echo ------------------------------------------------
    echo            AARTS_CLI
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-cli
    npm install && npm update
    npm version patch
    npm run build
    cd dist
    npm publish -m "dev update"
}
buildandpublish_aarts_eb_notifier()
{
    echo ------------------------------------------------
    echo            AARTS_EB_NOTIFIER
    echo ------------------------------------------------
    cd $AARTS_HOME/packages/aarts-eb-notifier
    npm install && npm update
    npm version patch
    npm run build_lin
    npm publish -m "dev update"
    # npm link
}

# echo ------------------------------------------------
# echo            AARTS_EXAMPLE
# echo ------------------------------------------------
# cd $AARTS_HOME/example-app/airtours/airtours
# # npm link aarts-dynamodb
# # npm link aarts-handler
# npm install && npm update
# npm version patch
# npm run build_lin

# echo ------------------------------------------------
# echo            AARTS_EXAMPLE_INFRA
# echo ------------------------------------------------
# cd $AARTS_HOME/example-app/airtours/infra
# npm install && npm update
# npm version patch
# npm run build

buildandpublish_aarts_example_airtours()
{
    echo ------------------------------------------------
    echo            AARTS_EXAMPLE_APPSYNC
    echo ------------------------------------------------
    cd $AARTS_HOME/example-app/airtours-appsync/airtours-appsync
    # npm link aarts-dynamodb
    # npm link aarts-eb-handler
    # npm link aarts-eb-notifier
    # npm link aarts-eb-dispatcher
    npm install && npm update
    npm version patch
    npm run build_lin
}
# echo ------------------------------------------------
# echo            AARTS_EXAMPLE_APPSYNC_INFRA
# echo ------------------------------------------------
# cd $AARTS_HOME/example-app/airtours-appsync/infra/aarts-lambdas/dispatcher
# npm install && npm update
# cd $AARTS_HOME/example-app/airtours-appsync/infra/aarts-lambdas/notifier
# npm install && npm update

# cd $AARTS_HOME/example-app/airtours-appsync/infra

# npm version patch
# npm run build



#-------------------------------------------------------
#                 ENTRY POINT
#-------------------------------------------------------
while [ "$1" != "" ]; do
    case $1 in
        aarts-utils )               buildandpublish_aarts_utils
                                    shift
;;
        aarts-types )               buildandpublish_aarts_types
                                    shift
;;
        aarts-eb-types )            buildandpublish_aarts_eb_types
                                    shift
;;
        aarts-dynamodb )            buildandpublish_aarts_dynamodb
                                    shift
;;
        aarts-dynamodb-events )     buildandpublish_aarts_dynamodb_events
                                    shift
;;
        aarts-handler )             buildandpublish_aarts_handler
                                    shift
;;
        aarts-eb-handler )          buildandpublish_aarts_eb_handler
                                    shift
;;
        aarts-eb-dispatcher )       buildandpublish_aarts_eb_dispatcher
                                    shift
;;
        aarts-cli )                 buildandpublish_aarts_cli
                                    shift
;;
        aarts-eb-notifier )         buildandpublish_aarts_eb_notifier
                                    shift
;;
        aarts-example-airtours )    buildandpublish_aarts_example_airtours
                                    shift
;;
    esac
    shift
done




cd $AARTS_HOME/packages/aarts-cli