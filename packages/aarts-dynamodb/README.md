# aarts-dynamodb
Aws artifacts(aarts) helps you get up to speed with migrating your existing domain logic to aws serverless lambda, using dynamodb persistent storage. This package is about handling the CRUD operations in a consistent manner.

A very rough analogy for `aarts-dynamodb` would be: "this is the mongoose in mongodb, for dynamodb". However when you used with other aarts-* libraries it becomes an antire framework for end-to-end development, from handling the requests to the push notifications via AWS AppSync

## Opinion of the Author

When building a generic library on top of dynamo, you presumably do not know anything about the specific use case, thus the specific access patterns. I.e all the relational joins needed, which (when having in mind specific business case) may be implemented by storing data into application-defined partions(employee partition, order partition etc) are not possible. I.e, when you do not know the specific use case, you cannot define a partition, say with a PK=employee_1. That's why for aarts-dynamodb, __in the table__ (remark* - in the table), each item has its own partition. The only things that can reside in an item's partition (remark* again - speaking about __the table__) are its previous versions, and the various copies of the most current version, which enable querying and access patterns.
We have to recall that this is a generic library, so query and access patterns are __defined on an application level__ - by the client that uses the generic library. 

The various copies of the most recent item's version are always maintained consistent with the original (v_0) item by employing per item transactions.
Using thransactions on an item level, requires us to define a higher level unit of work, "procedure" - a procedure will be comprosed of multiple events for CRUD over items, and should be eventually consistent - ensured by the client application logic. Aarts-dynamodb will only take care of registering events comming from different procedures (will perform base aggregations)

If we go back to that remark* above, about the joins and partitions: Yes, on the main table, one can say there are no "rds joins" possible, because of the partitions structure etc. However, lets see what happens on the GSI level: When the client applications define their own keys of interest (aka refkeys), `aarts-dynamodb` will ensure those keys are present in corresponding GSI fields (meta/smetadata or meta/nmetadata). So, actually, "rds joins" __are implemented on a GSI level__.

## From generic library to optimized for custom needs

It is important to note the expensiveness of this library, in terms of dynamo RCUs and WCUs. The value of this library is that with 5 GSIs in total, one can define an entity, with up to 20 foreign keys.
All this definitions are happening very easy, on the application level. However in order to achieve this, however, when inserting an entity, there will be +2 more WCU used for each FK defined (transactional write of the copied entity). Because of the easyness of defining and low time for development, this library is very useful for designing and testing different data models and identifying/optimizing query patterns needed for an application. However, once those are identified, one can replace the enourmous copying of items (consuming WCU/RCU), and instead of relying on the 5 generic GSI, define his own. Then, copying is not done via writing completley separate dynamo item, but only copying the item's identified keys into respective GSI keys

## Refkeys

In the code, often we deal with the term `refkey`. That is, when the same item is copied according to its refkey configuration, for ease of querying. So in this library, "the enourmous duplicating of data" which Rick talks about is focused on mirroring same data in different morph forms, to enable access patterns.

# On Querying

The most difficult part :). 
- used are 5 GSIs in total, which may be thought of three reverse GSI lookups 
  - 1. table's PK|RANGE<->RANGE|PK
  - 2. particular item's key|its value <-> its value|its key - __for strings__
  - 3. same as 2. but __for numbers__ 
- In `aarts-dynamodb` there are two querable data types: `number` and `string`
  - Making distinguishment between strings and numbers, enables more broad querying mechanisms on the RANGE key (for example numerical sorting, between etc)
- When we talk above about (reverse) lookups on "particular item's key|value" - in order to enable these GSI lookups, we first need to make it a `refkey`. 
  - Once a refkey is defined, it already will have its own partition, where you can do "rds joins" on - with the corresponding GSI (meta/smetadata or meta/nmetadata - depending on the type of the key's value (string/number))
- `refkey`s are the keys of a dynamo item, over which one can query. And this is the generic part of this library - the client application will define them, in a very easy way (refer to __specs__/testmodel/_DynamoItems)

For the whole picture please refer to the example-app in the main folder of the repo 

## Features 
- [single table design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-general-nosql-design.html#bp-general-nosql-design-concepts) implementation
- optimistic locking implementation (i.e dont update items if you do not have the most latest version)
- historical records of the items manipulations (with revisions, enabling the optimistic locking implementation)
- aggregation record keeping totals of all domain items (note: you need to `process.env.PERFORM_AGGREGATIONS="1" to enable it`)
  - right now is turned off by default, as it may cause lots of locking transactions(["its too expensive", ref video - 37:28](https://www.youtube.com/watch?v=6yqfmXiZTlM&t=4s)
  - if one creates many items at once while PERFORM_AGGREGATIONS=1 , multiple creates are still supposed to pass, because of the retry and backoff mechanisms in place, however the right way to implement agregations is via DynamoDB streams + Kinesis firehose (WIP, [ref video](https://www.youtube.com/watch?v=6yqfmXiZTlM&t=4s) 36:29 - 39:29)
- [Unique constraints](https://aws.amazon.com/blogs/database/simulating-amazon-dynamodb-unique-constraints-using-transactions/)
- Higher level item manager objects, which lay foundations on client domain logic plugging
- Async generators, who can yield validation messages and return the actual result (if all validation/logic succeeded)
  - Particularly very useful, when integrating with AppSync/subscriptions. Imagine a progress bar implementation where in the backend you process some huge list of operations (even in parallel / from separate scaled lambdas) and occasionally just do something simple, similar to `yield 100*(<provessed>/<all>)`. A client subscribed to a particular `worker:output` eventSources will get all those yields via AppSync, so you can update the progress bar

## Querying and building models is made generic as much as possible 
Ofcourse, as Dynamodb is all about the specific use case and its access patterns, you may stumble upon an aggregation, or a "join of data" requiremens not present in this library. In this case, you implement it on a itemManager level - in your client app's domain.


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

# Improve (TODOs)
- implement functionality around the `ref` property of a refkey - all specified refkeys to be loaded, with their full contents to be able to be returned, by a single request (currently only their ids are returned)
- consider filling smetadata key on the main item level (v_0) with the item's id. This way, the first reverse GSI lookup (PK|RANGE<->RANGE|PK) can be utilized from the GSI meta__smetadata, eliminating the need of the 5th GSI meta__id (verify other functionality will operate as before!)
- Improve higher level (Managers) querying ease of use
- Forward the ring token passed from `aarts-eb-dispatcher` to `clientToken` property in Dynamo - for filtering out dublicated, events for transactions, which have already passed (refer to the [Idempotency section of Dynamodb Transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)) Note: idempotency is already paid attention, however on a higher, application level (Using the ringToken for the GUID part of an item id) - however implementing this will give further confidence and best practices implementation
- In `aarts-dynamodb`, defining refkeys/relations on a client application level are very cheap, in terms of development (see __specs__/testmodel/_DynamoItems.ts). `HOWEVER TODO` Ensure consistency of data, if the refkey definitions on application level change - i.e erase any morph forms created because of a refkey definition that is no longer present
- excerpt the PERFORM_AGGREGATIONS functionality in a separate module aarts-dynamodb-aggregations, which employs Dynamodb streams and Kinesis firehose
- Store un-indexed attributes in a single JSON attribute and then only excerpt refkeys on the item record level (how this affects additional filtering) TODO - it actually might be a bad idea for a generic library such as this, as you want to enable users to define and delete refkeys along the development process. In this case one should push and pull a deleted refkey property in and out from a json property





