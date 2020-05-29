 # Example app
- An air lines app, dealing with:
  - Flights
  - Airplanes
  - Airports
  - Pasangers
  
 
### TODO consider a separate repo
in order to run the example you need only this folder. There are now npm packages for aarts-* specific code
 
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
- desribe payloads
- describe possible queries
- [OK]~~unique constraints
- [OK]~~scripts for aws resource creation
- [OK]~~script for sam local dynamodb
- desribe local development
- [OK]~~maintain aggregation records for each domain entity (i.e support "total items" in grid views)
- support for scheduling a call to itself with specific payload (i.e on an expiration of an order you want to do something..)


## TODO item's start(call) method implementation - for invoking procedures, that are more than simple CRUD operations
