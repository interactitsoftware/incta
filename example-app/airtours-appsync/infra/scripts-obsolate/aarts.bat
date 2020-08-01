rem cdk synth --no-staging --profile akrsmv > template.yml

rmdir /Q /S .\node-modules-layer\nodejs\node_modules
mklink /J .\node-modules-layer\nodejs\node_modules ..\airtours-appsync\node_modules
FOR /F %%L IN ('node getlambdanames handler') DO set CfnLambdaName=%%L  
node .\node-modules-layer\nodejs\node_modules\aarts-eb-dispatcher\samLocalSimulateHandler.js %~dp0test-events\snsDispatcher\%1.json | sam local invoke %CfnLambdaName% --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json