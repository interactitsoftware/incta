rmdir /Q /S ..\airtours\libs-lambda-layer\nodejs\node_modules
mklink /J ..\airtours\libs-lambda-layer\nodejs\node_modules ..\airtours\node_modules
cdk deploy --require-approval never --profile akrsmv