rem cdk synth --no-staging --profile akrsmv > template.yml
FOR /F %%L IN ('node getlambdanames handler') DO set CfnLambdaName=%%L  
node ..\lambda-source\lib\event-dispatcher\dist\samLocalSimulateHandler.js %1 | sam local invoke %CfnLambdaName% --event - --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json