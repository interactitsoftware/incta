# TODO consider a separate repo
in order to run the example you need only this folder. There are now npm packages for aarts-* specific code

# Example app
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

## TODO item's start(call) method implementation - for invoking procedures, that are more than simple CRUD operations
