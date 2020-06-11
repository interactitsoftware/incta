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

## Benchmarking

- an item's refkeys have limitations, dictated by the limit of up to 25 operations in a DynamoDb transaction:
  - When creating
    - nr of all refkeys + nr of those refkeys that are unique should be <= 23 
    - that is 1. main item, 2. aggregations update, 3 refkey operations (23 left)
  - When updating
    - nr of all refkeys + 2*(those refkeys marked unique, which are also in an update payload should be) <= 22
    - that is 1. main item 2. aggregations update 3 refkey updates, and if a unique refkey is updated :1. delete old 2. insert new
--- as all refkeys are always experiencing updates (they need to be kept consistent with main item), update action constraints, overwrites the more liberal create constraints so:
 nr of all refkeys + 2*(nr of those refkeys that are unique) should be <= 22 TODO add a test for that
 example OK limits
 - an item with 11 refkeys and 5 of them to be marked unique. 11 + 2*5 = 21 < 22 (OK)
 - an item with 22 refkeys and none of them marked unique. 22 + 2*0 = 22 <= 22 (OK)
 - an item with 20 refkeys and 1 of them marked unique. 20 + 2*1 = 22 <= 22 (OK)
example NOT OK limits
 - an item with 20 refkeys and 2 of them marked unique. 20 + 2*2 = 24 > 22 (NOT OK)
 - an item with 23 refkeys and none of them marked unique. 23 + 2*0 = 23 > 22 (NOT OK)

# Improve
Store un-indexed attributes in a single JSON attribute and then only excerpt refkeys on the item record level (how this affects additional filtering)




