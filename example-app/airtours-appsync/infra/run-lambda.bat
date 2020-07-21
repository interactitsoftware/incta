rem cdk synth --no-staging --profile %AWS_PROFILE% > template.yml
FOR /F %%L IN ('node getlambdanames %1') DO set CfnLambdaName=%%L 

rmdir /Q /S .\node-modules-layer\nodejs\node_modules
mklink /J .\node-modules-layer\nodejs\node_modules ..\airtours-appsync\node_modules
sam local invoke %CfnLambdaName% --event ./test-events/%2.json --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json