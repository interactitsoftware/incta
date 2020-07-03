- [nice bootstrap for angular as a static site in aws](https://github.com/harveyramer/deploy-angular-with-cdk)
- ^^which is taken from [here](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/static-site)
    - `cd ./angular.io/angular-example-cdk && npm install`
    - `cd ./angular.io && npm run build`
    - `cdk deploy --context domain=akrsmv.net --context subdomain=angular-example --profile akrsmv`
    - site is deployed currently without cloud front, it can be enabled by uncommenting bunch of code in the iac, however region/ACM certificate should be sorted out

## setup for [aws-amplify](https://docs.amplify.aws/start/q/integration/angular) lib
- `./angular.io/angular-example-cdk && npm install aws-amplify`