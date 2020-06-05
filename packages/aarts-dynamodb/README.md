# Transactional CRUD
## History & Unique constraint supported as per Dynamo docs
## Up to 10 reference keys in an item are ensured
That is, the same item is copied according to its refkey configuration, for ease of querying.
This happens in transaction, thats why the limit, as DynamoDB transactions are up to 25 operations. 
Inspired by https://www.youtube.com/watch?v=HaEPXoXVf2k
More documentation needed
## Querying and building models is made generic as much as possible 
![Test Model, test are based on](./test-model.svg)

## Tests 
## Documentation coming


