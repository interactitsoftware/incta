# aarts
Aws artifacts(aarts) helps you get up to speed with migrating your existing domain logic to aws serverless lambda, using dynamodb persistent storage. It is modularized into npm packages, so client applications may focus only on domain logic. Please refer to the example-app in this repo 

The code in this repo is for educational purposes only. Performance is always the highest prioirity, however due to the educational nature of the repo, there are aspects of the code not directly suitable for production use. (For example sending debug messages trough an sns topic, only to land in an SQS queue for visualizatoin, debugging and gaining knowledge on SQS-SNS subscribtion filters and DLQs)

For using it in your business domain, you may fork the repo and tweak the logic to your needs, respecting the repository licence.

# Features
## DynamoDB
- [single table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html#bp-general-nosql-design-concepts) implementation
- optimistic locking implementation
- historical records of the items manipulations
- aggregation record keeping totals of all domain items (Note - for educational purposes on dynamodb transactions! the Right way to implement this is via dynamo streams + AWS firehose)
- [Unique constraints](https://aws.amazon.com/blogs/database/simulating-amazon-dynamodb-unique-constraints-using-transactions/)
- Higher level item manager objects, which lay foundations on client domain logic plugging
- Async generators, who can yield validation messages and return the actual result (if all validation/logic succeeded)

## Lambda
- Domain Logic uploaded into a AWS Lambda Layer
- SNS-SQS subscription for an event-bus async features
- AppSync/GraphQL asynchronous notifications
- Notifying for any errors via SNS topic
  
## initial conditions
- You have a set of domain entities, a business context, with a controllers / repositories / etc, and probably with bunch of domain validators in fornt of any CRUD/RPC logic.
  OR
- you start building an app from scratch

## Prerequisites
- aws cli, nodejs, typescript
- aws sam local, docker, NoSQL AWS Workbench - for rapid local development

----------

## First milestone implementation
- Injecting whatever domain logic into the lambda handler, simple IoC using the Nodejs Global interface. Convention. Pattern Matching.
- Decribing the domain entities, in a way, for aarts to know which one are of interest, so we can query over them
- Typescript async generators allowing for reporting (notifying clients etc) over the execution progress (yielding notifications, returning results)
- Mixin patterns for merging / decorating each domain entitiy with necessary dynamo item keys. Thanks to [Nickolay Platonov](https://www.bryntum.com/blog/the-mixin-pattern-in-typescript-all-you-need-to-know/)
- Dynamodb transactional operations, allowing for a domain entity with up to 23 refkeys
- Queries: Mainly index preloading, implemented with 4 GSI used for describing all domain key properties of interest (currently 2 for string types and 2 of number types)
- Keeping a history of all CRUD mainpulations, using versioning

- Dynamodb trickery is inspired by the talks of [Rick Houlihan](https://www.youtube.com/watch?v=HaEPXoXVf2k&t=1054s) and the [AWS Dynamodb best practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)



