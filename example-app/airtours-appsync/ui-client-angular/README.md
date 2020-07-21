- [nice bootstrap for angular as a static site in aws](https://github.com/harveyramer/deploy-angular-with-cdk)
- ^^which is taken from [here](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/static-site)
    - `cd ./angular.io/angular-example-cdk && npm install`
    - `cd ./angular.io && npm run build`
    - `cdk deploy --context domain=akrsmv.net --context subdomain=angular-example --profile akrsmv`
    - site is deployed currently without cloud front, it can be enabled by uncommenting bunch of code in the iac, however region/ACM certificate should be sorted out

## setup for [aws-amplify](https://docs.amplify.aws/start/q/integration/angular) lib
- `./angular.io/angular-example-cdk && npm install aws-amplify`




# FULL local environment would need 
- Backend --> up to dynamo local and jest tests
- FE --> up to Mocked GraphQL server, jest tests, and mock / config for turning off/simulating auth
- How to mock notifications - instead of notifer soaking from SNS, we need printing them to a file, and an observer for that file, which ... (what?)