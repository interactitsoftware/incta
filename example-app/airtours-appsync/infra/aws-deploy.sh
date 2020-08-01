
mkdir -p node-modules-layer/nodejs
rm ./node-modules-layer/nodejs/node_modules
./ln-cross-platform.sh ./node-modules-layer/nodejs/node_modules ../airtours-appsync/node_modules

cdk deploy --require-approval never --profile akrsmv