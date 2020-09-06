{
  "action": "start",
  "item": "erase_data",
  "arguments": {},
  "identity": {
    "username": "akrsmv"
  }
}

{
  "action": "create",
  "item": "tourist",
  "arguments": {
      "airplane": "nomer 5",
    "flight": "some flight id",
    "from_airport": "kenedi",
    "to_airport": "frankfurt",
    "from_country": "usa",
    "to_country": "germany"
  },
  "identity": {
    "username": "akrsmv"
  }
}

{
  "action": "start",
  "item": "multiple_lambda_test_data_generator",
  "arguments": {},
  "identity": {
    "username": "akrsmv"
  }
}

{
    "item": "airport",
    "action": "query",
    "arguments":{
      "pk": "airport}airport_size",
      "range": {"min": 10, "max":12},
      "ddbIndex": "meta__nmetadata",
      "filter": [{
        "key": "date_created",
        "predicate": "=",
        "value": "2020-09-05T21:15:25.303Z"
      }],
      "limit": 2,
      "paginationToken": null
    },
    "identity": {
      "username": "akrsmv"
    }
}

****************************
* 3 refs, 1 UQ, 4 TOTAL
****************************
export class _specs_CountryItem extends DynamoItem(_specs_Country, "country", [
    {key: "name", unique: true},
    {key: "currency"},
    {key: "code"}
]) { }

****************************
* 6 refs, 1 UQ, 7 TOTAL
****************************
export class _specs_AirportItem extends DynamoItem(_specs_Airport, "airport", [
    {key: "name", unique: true},
    {key: "country", ref: "country"},
    {key: "airport_size"},
	{key: "code"},
	{key: "branch"},
	{key: "type"},
]) { }





****************************
* 7 refs, 1 UQ, 8 TOTAL
****************************
export class _specs_FlightItem extends DynamoItem(_specs_Flight, "flight", [
    {key: "flight_code", unique:true},
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season"}, // although not pointing to other type, we still want to query by it
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]) { }


****************************
* 10 refs, 1 UQ, 11 TOTAL
****************************
export class _specs_TouristItem extends DynamoItem(_specs_Tourist, "tourist", [
    {key: "iban", unique:true},
    {key: "fname"},
    {key: "lname"},
    {key: "iban"},
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "flight", ref: "flight"}, 
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]) { }

****************************
* 5 refs, 1 UQ, 6 TOTAL
****************************
export class _specs_AirplaneItem extends DynamoItem(_specs_Airplane, "airplane", [
    {key: "reg_uq_str", unique: true},
    {key: "reg_uq_number", unique: true},
    {key: "number_of_seats"},// although not pointing to other type, we still want to query by it
    {key: "model", ref: "airplane_model"},
    {key: "manifacturer", ref: "airplane_manifacturer"},
]) { }





****************************
* 2 refs, 1 UQ, 3 TOTAL
****************************
export class _specs_AirplaneModelItem extends DynamoItem(_specs_AirplaneModel, "airplane_model", [
    {key: "name", ref: "unique"},
    {key: "manifacturer", ref: "manifacturer"}
]) { }

****************************
* 2 refs, 1 UQ, 3 TOTAL
****************************
export class _specs_AirplaneManifacturerItem extends DynamoItem(_specs_AirplaneManifacturer, "airplane_manifacturer", [
    {key: "name", ref: "unique"},
    {key: "country", ref: "country"}
]) { }