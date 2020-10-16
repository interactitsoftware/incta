# Artifacts in AWS (aarts)
This is a AWS serverless application, with end to end developer experience. It targets configurable speed to cost ratio, that remains the same *at any scale*. 

Aarts is taking care of events handling topology, and underlying dynamodb storage, allowing for focusing only on domain logic development. It does that by a simple pattern matching mechanism, accross AppSync, SNS, SQS and DynamoStreams. Aarts comprise of 6 lambdas in total, which (by the pattern matching strategy) will invoke particular Command or Query from your domain.

Performance is of highest prioirity, however significant further cost and data model optimizations can be made, once it is about a concrete business problem

## End to end developer experience
- local development environment, using `aws-cli` `sam` `local dynamodb`
- infrastructure as code, using `aws-cdk`
- push notifications, using `Appsync` and `GraphQL subscriptions`. Aarts workers are javascript async generators. All yielded messages (for ex. validations, etc) can be forwarded to client applications, via the `feeder` lambda
- __aarts-cli__ __*(WIP)*__
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

### trouble shooting
- first do a cleanup:
- remove all node_modules `find . -name "node_modules" -exec rm -rf '{}' +`
- remove all package-lock files: `find . -name "package-lock.json" -exec rm -rf '{}' +`
- ensure proper line endings: `find . -type f -exec dos2unix -k -s -o {} ';'`
- rebuild: `cd ./packages/aarts-cli && sh buildandlink.sh` (well, you need to edit buildandlink.sh not to publish to npm :))

# Useful
[git 2fa with wsl2](https://gist.github.com/evillgenius75/613a44aa407300a08d0e3faea4c9df6b)

This is a monorepo, home of multiple npm packages:
- `aarts-types`
- `aarts-dynamodb`
- `aarts-dynamodb-events`
- `aarts-handler`
- `aarts-eb-types`
- `aarts-eb-notifier`
- `aarts-eb-handler`
- `aarts-eb-dispatcher`

It also hosts example apps with the intention to demonstrate how above npm packages can work toghether


