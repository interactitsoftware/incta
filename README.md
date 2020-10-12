# aarts
Serverless application, with end to end developer experience. Project is open source and looking for contributors and sponsors. It targets cost optimization and configurable speed to cost ratio, *at any scale*. Because its serverless, if the app is not used, it won't generate any costs, while still, always available.

Aws artifacts(aarts) helps you get up to speed with migrating your existing domain logic to aws serverless lambda, using dynamodb persistent storage. 

Performance is always the highest prioirity, however further cost and data model optimizations can be made, once it is about a concrete business problem


__*(WIP)*__ __aarts-cli__
- `aarts init-project <project-name>` - creates skeleton for project
- `aarts new-item` - creates bolierplate code for new item and its manager with CRUD/start actions 
- `aarts test` - run jest tests
- `aarts build` - only builds
- `aarts deploy [--profile <aws-profile>] [--stack-name <aws-cfn-stack-name>]` - deploys in AWS
- `aarts ejects` - ejects cdk infrastructure

For using it in your business domain, you may fork the repo and tweak the logic to your needs, respecting the repository licence.

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

# Features
- Async generators, yielding (validation, or whatever) messages
- Graphql queries, allowing for getting all data needed at once
- [single dynamo table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html#bp-general-nosql-design-concepts) implementation
- optimistic locking implementation
- historical records of the items manipulations
- aggregation record keeping totals of all domain items
- [Unique constraints](https://aws.amazon.com/blogs/database/simulating-amazon-dynamodb-unique-constraints-using-transactions/)
- Higher level item manager objects, which lay foundations for client domain logic plug-ing


## Prerequisites
- [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-html)
- [docker](https://docs.docker.com/desktop/)
- [nodejs](https://nodejs.org/en/download/)
- `npm i -g typescript node-ts jest`
- [NoSQL AWS Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html)
- [aws sam](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) (optional, currently dev testing is mainly via jest)

### Create local dynamo test table
- `aws dynamodb create-table --cli-input-json file://local-dev-table-def.json --endpoint-url http://localhost:8000`

### trouble shooting
- first do a cleanup:
- `find . -name "node_modules" -exec rm -rf '{}' +`
- `find . -name "package-lock.json" -exec rm -rf '{}' +`




