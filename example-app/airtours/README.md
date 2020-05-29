 # Example app
 
#### in order to run the example you need only this folder. There are now npm packages for aarts-* specific code
##### TODO consider a separate repo

- The example is an air lines app, dealing with:
  - Flights
  - Airplanes
  - Airports
  - Pasangers
  
Each of theese may have their domain specific validation logic, etc. Refer to AirplaneItem for example. Inthere the key number_of_seats is defined as unique, meaning that a only one airplane may exists with particular number_of_seats (well, not so meaningful actually :))

Notice how all the code is purely domain specific - except the code in index.ts where domain entities are being "decorated" and their keys of interest for us are described (references, unique constraints etc). Still the app operate in the context of aws lambda, with the help of the three aarts* npm packages
- `aarts-types` provides the basic interfaces used
- `aarts-handler` is where we use pattern matching to invoke domain specific logic
- `aarts-dynamodb` is our dynamodb adapter

I will appreciate any feedback on this project, and its feature list. 

Also, if you found it helpful, you may buy me a cup of tea :) 
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](krasimir.atanasoff@gmail.com)

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
