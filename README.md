# aarts-core
Aws artifacts(aarts) helps you get up to speed with migrating your existing domain logic to aws serverless lambda, using dynamodb persistent storage. It is modularized into npm packages, so client applications may focus only on domain logic. Please refer to the example-app in this repo 

# Features
- unique values/constraints
- references to other records
- transactional crud operations
- aggregations
  
## Final goal
Implementing a simple interface will allow you to run your code in an aws lambda container, using the infinite-scaling dynamodb, as persistent storage. In the core version, there is only one lambda needed. Client (domain) code is deployed into a lambda layer, so the code for the lambda is really a tiny one, only serving as a dispatcher to different entry points into the client application. 

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
- Decribing the domain entities, in a way, for aarts to know which one are of interest, so we can query over them (I call them refkeys)
- Typescript async generators allowing for reporting (notifying clients etc) over the execution progress
- Mixin patterns for merging / decorating each domain entitiy with necessary dynamo item keys. Thanks to [Nickolay Platonov](https://www.bryntum.com/blog/the-mixin-pattern-in-typescript-all-you-need-to-know/)
- Dynamodb transactional operations, allowing for a domain entity with up to 23 refkeys
- Queries: Mainly index preloading, implemented with 4 GSI used for describing all domain key properties of interest (currently 2 for string types and 2 of number types)
- Keeping a history of all CRUD mainpulations, using versioning

- Dynamodb trickery is mainly inspired by the talks of [Rick Houlihan](https://www.youtube.com/watch?v=HaEPXoXVf2k&t=1054s)
## Example usage
- An air lines app, dealing with:
  - Flights
  - Airplanes
  - Airports
  - Pasangers
  
Each of theese may have their domain specific validation logic, etc. Refer to AirplaneItem for example 

Notice how everything except the code in index.ts is entirely domain specific.

Still the app can operate in the context of aws lambda, with the help of the three aarts* npm packages
- `aarts-types` provides the basic interfaces used
- `aarts-handler` is where we use pattern matching to invoke domain specific logic
- `aarts-dynamodb` is our dynamodb adapter


TODO
- [OK]~~provide example domain
- describe refkeys 
- describe actions: create, update, delete, get, query, 
- TODO action: start(call)
- desribe payloads
- describe possible queries
- scripts for aws resource creation
- script for sam local dynamodb
- desribe local development
- maintain aggregation records for each domain entity (i.e support "total items" in grid views)
- support for scheduling a call to itself with specific payload (i.e on an expiration of an order you want to do something..)

