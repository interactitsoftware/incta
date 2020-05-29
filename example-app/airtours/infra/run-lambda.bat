rem cdk synth --no-staging --profile %AWS_PROFILE% > template.yml
FOR /F %%L IN ('node getlambdanames index') DO set CfnLambdaName=%%L 

rmdir /Q /S ..\airtours\libs-lambda-layer\nodejs\node_modules
mklink /J ..\airtours\libs-lambda-layer\nodejs\node_modules ..\airtours\node_modules
sam local invoke %CfnLambdaName% --event ./test-events/%1.json --region ddblocal --docker-network sam-local --template template.yml --env-vars env-constants-local.json