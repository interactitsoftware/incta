# aarts
A fully serverless application, with end to end developer experience - from automated testing to CI/CD pipelines. Project is open source and looking for contributors and sponsors. It targets cost optimization and configurable speed to cost ratio, *at any scale*. Current achievements are processing 250K events for 30 minutes at ~$50 (depending on the processing needed). Because its serverless, if the app is not used, it won't generate any costs, while still, always available.

Aws artifacts(aarts) helps you get up to speed with migrating your existing domain logic to aws serverless lambda, using dynamodb persistent storage. It is modularized into npm packages, so client applications may focus only on domain logic. Please refer to the example-app in this repo 

The code in this repo is for educational purposes/bootstrapping only. Performance is always the highest prioirity, however due to the generic nature of the repo, there are aspects of the code not directly suitable for production use. A significant cost and data model optimizations can be made, once it is about a concrete business problem

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
- `aarts-handler`
- `aarts-eb-types`
- `aarts-eb-notifier`
- `aarts-eb-handler`
- `aarts-eb-dispatcher`

It also hosts example apps with the intention to demonstrate how above npm packages can work toghether

# Features
- Async generators, who can yield (validation, or whatever) messages
- Graphql queries, allowing for getting all data needed at once
- [single dynamo table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html#bp-general-nosql-design-concepts) implementation
- optimistic locking implementation
- historical records of the items manipulations
- aggregation record keeping totals of all domain items
- [Unique constraints](https://aws.amazon.com/blogs/database/simulating-amazon-dynamodb-unique-constraints-using-transactions/)
- Higher level item manager objects, which lay foundations for client domain logic plug-ing


## Prerequisites
- aws cli, nodejs, typescript, jest
- aws sam local, docker, NoSQL AWS Workbench - for rapid local development


