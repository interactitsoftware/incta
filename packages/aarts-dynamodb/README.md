# aarts-dynamodb
Aws artifacts(aarts) helps you get up to speed with migrating your existing domain logic to aws serverless lambda, using dynamodb persistent storage. This package is about handling the CRUD operations in a consistent manner. For the whole picture please refer to the example-app in the main folder of the repo 

## Consistent, transactional CRUD operations
But wait, if its just a single item update/create, how come all should succeed? If you ask this question, so probably this package is not for you. Or, you may consider reading about some of the many specifics around dynamodb.

## Features 
- [single table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html#bp-general-nosql-design-concepts) implementation
- optimistic locking implementation
- historical records of the items manipulations
- aggregation record keeping totals of all domain items
- [Unique constraints](https://aws.amazon.com/blogs/database/simulating-amazon-dynamodb-unique-constraints-using-transactions/)
- Higher level item manager objects, which lay foundations on client domain logic plugging
- Async generators, who can yield validation messages and return the actual result (if all validation/logic succeeded)

## Querying and building models is made generic as much as possible 
However, as Dynamodb is all about the specific use case and its access patterns, you may want to tweak the code as it best fits the specific use case, in order to optimize for querying capabilities and costs

## Refkeys
In the code, often we deal with the term `refkey`. That is, when the same item is copied according to its refkey configuration, for ease of querying.
This happens in transaction, thats why the limit, as DynamoDB transactions are up to 25 operations. 
Inspired by https://www.youtube.com/watch?v=HaEPXoXVf2k

More documentation needed. For now, please refer to the jest tests in the __specs__ folder in the repo. I ensured a good coverage. For any questions please contact the author of the package or file an issue in github.

### Test Model, tests are based on
<img src="https://github.com/akrsmv/aarts-core/blob/master/packages/aarts-dynamodb/test-model.svg">



