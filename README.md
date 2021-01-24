# Artifacts in AWS (aarts)
This is a AWS serverless application, with end to end developer experience. It targets configurable speed to cost ratio, that remains the same *at any scale*. 

Aarts is taking care of events handling topology, and underlying dynamodb storage, allowing for focusing only on domain logic development. It does that by a simple pattern matching mechanism, accross AppSync, SNS, SQS and DynamoStreams. Aarts comprise of 6 lambdas in total, which (by the pattern matching strategy) will invoke particular Command or Query from your domain.

Performance is of highest prioirity, however significant further cost and data model optimizations can be made, once it is about a concrete business problem

## End to end developer experience
- local development environment, using `aws-cli` `sam` `local dynamodb`
- infrastructure as code, using `aws-cdk`
- push notifications, using `Appsync` and `GraphQL subscriptions`. Aarts workers are javascript async generators. All yielded messages (for ex. validations, etc) can be forwarded to client applications, via the `feeder` lambda
- __bootstrap-cli__ __*(WIP)*__
- Graphql queries, allowing for getting all data needed at once
- [single dynamo table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html#bp-general-nosql-design-concepts) implementation
- optimistic locking
- historical records of the items manipulations
- aggregation records keeping totals of all domain items, by their state
- [Unique constraints](https://aws.amazon.com/blogs/database/simulating-amazon-dynamodb-unique-constraints-using-transactions/)
- Higher level item manager objects, which lay foundations for client domain logic plug-ing

## Prerequisites
- [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- [docker](https://docs.docker.com/desktop/)
- [nodejs](https://nodejs.org/en/download/)
- `npm i -g typescript node-ts jest`
- [NoSQL AWS Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html)
- [aws sam](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
## Recommended way of development on Windows is via WSL2
- [setup nodejs](https://docs.microsoft.com/en-us/windows/nodejs/setup-on-wsl2)
- [install sam for Linux](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [install aws cli for Linux](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html#cliv2-linux-install)

### Create local dynamo test table
- `aws dynamodb create-table --cli-input-json file://local-dev-table-def.json --endpoint-url http://localhost:8000`

# TODOs
- start using [lerna](https://github.com/lerna/lerna)
- boilerplate code generation in aarts-cli. Goal is to be able to bootstrap a project from single data-model.json file
- Graphql schema, query, mutations generation from whitin cdk, based on the client app's data-model.json 

### trouble shooting
- first do a cleanup:
- remove all node_modules `find . -name "node_modules" -exec rm -rf '{}' +`
- remove all package-lock files: `find . -name "package-lock.json" -exec rm -rf '{}' +`
- ensure proper line endings: `find . -type f -exec dos2unix -k -s -o {} ';'`
- rebuild: `cd ./packages/aarts-cli && sh buildandlink.sh` (well, you need to edit buildandlink.sh not to publish to npm :) TODO start using lerna)

# Useful
[git 2fa with wsl2](https://gist.github.com/evillgenius75/613a44aa407300a08d0e3faea4c9df6b)
[Linux GUI apps with wsl2](https://techcommunity.microsoft.com/t5/windows-dev-appconsult/running-wsl-gui-apps-on-windows-10/ba-p/1493242)
[Linux GUI appImage with wsl2](https://discourse.appimage.org/t/run-appimage-on-windows/177)
[dynamo marshaller](https://awslabs.github.io/dynamodb-data-mapper-js/packages/dynamodb-data-marshaller/)
[sns-sqs and dlqs](https://aws.amazon.com/blogs/compute/designing-durable-serverless-apps-with-dlqs-for-amazon-sns-amazon-sqs-aws-lambda/)
[sns-sqs and dlqs2](https://lumigo.io/blog/sqs-and-lambda-the-missing-guide-on-failure-modes/)
[the saga pattern and lambda](https://theburningmonk.com/2017/07/applying-the-saga-pattern-with-aws-lambda-and-step-functions/)


wsl2 setup again:
- install win 10
- install vs code
- enable win features: hyper-v and wsl
- install docker for win desktop (it will complain that wsl2 is not installed)
- install wsl2  
- [install nvm/node in wsl2](https://docs.microsoft.com/en-us/windows/nodejs/setup-on-wsl2)
- install git in wsl2 distro
- setup git SSH keys
- clone the repo, note: for local-dynamodb development you need to clone into the host's windows fs (mnt/c/..etc..), not under /home/..
- install [aws sam](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- install [aws cli for Linux](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html#cliv2-linux-install)
- install [AWS NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html) and setup a local connection to localhost:8000
- `npm install -g aws-cdk`
- `npm install -g typescript`