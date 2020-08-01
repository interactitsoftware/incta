rmdir /Q /S ..\airtours-appsync\libs-lambda-layer\nodejs\node_modules
mklink /J ..\airtours-appsync\libs-lambda-layer\nodejs\node_modules ..\airtours-appsync\node_modules
cdk deploy --require-approval never --profile akrsmv