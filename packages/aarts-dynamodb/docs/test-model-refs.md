{
  "action": "start",
  "item": "erase_data",
  "arguments": {},
  "identity": {
    "username": "akrsmv"
  }
}

{
  "action": "start",
  "item": "airtours_test_data_importer",
  "arguments": {},
  "identity": {
    "username": "akrsmv"
  }
}

{
  "action": "start",
  "item": "idmpt_multiple_lambda_test_data_generator",
  "ringToken": "22997aaf-5981-42fa-a728-626b96942614",
  "arguments": {},
  "identity": {
    "username": "akrsmv"
  }
}

{
  "action": "start",
  "item": "idmpt_single_lambda_test_data_generator",
  "ringToken": "22997aaf-5981-42fa-a728-626b96942614",
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

************************************************************************
* 1 3 refs, 1 UQ ref, + v_0 + ringToken = 6 TOTAL for 1 item; 7 Country items: 42 items TOTAL
************************************************************************
export class _specs_CountryItem extends DynamoItem(_specs_Country, "country", [
    {key: "name", unique: true},
    {key: "currency"},
    {key: "code"}
]) { }

************************************************************************
* 6 refs, 1 UQ ref, + v_0 + ringToken = 9 TOTAL for 1 item; 10 Airport items: 90 items TOTAL
************************************************************************
export class _specs_AirportItem extends DynamoItem(_specs_Airport, "airport", [
    {key: "name", unique: true},
    {key: "country", ref: "country"},
    {key: "airport_size"},
	{key: "code"},
	{key: "branch"},
	{key: "type"},
]) { }

************************************************************************
* 2 refs, 1 UQ ref, + v_0 + ringToken = 5 TOTAL for 1 item; 2 AirplaneManifacturer items: 10 items TOTAL
************************************************************************
export class _specs_AirplaneManifacturerItem extends DynamoItem(_specs_AirplaneManifacturer, "airplane_manifacturer", [
    {key: "name", ref: "unique"},
    {key: "country", ref: "country"}
]) { }

************************************************************************
* 3 refs, 1 UQ ref, + v_0 + ringToken = 6 TOTAL for 1 item; 3 AirplaneModel items: 18 items TOTAL
************************************************************************
export class _specs_AirplaneModelItem extends DynamoItem(_specs_AirplaneModel, "airplane_model", [
    {key: "name", ref: "unique"},
    {key: "manifacturer", ref: "manifacturer"},
    {key: "country", ref: "country"},
]) { }

************************************************************************
* 5 refs, 2 UQ refs, + v_0 + ringToken = 9 TOTAL for 1 item; 5 Airplane items: 45 items TOTAL
************************************************************************
export class _specs_AirplaneItem extends DynamoItem(_specs_Airplane, "airplane", [
    {key: "reg_uq_str", unique: true},
    {key: "reg_uq_number", unique: true},
    {key: "number_of_seats"},// although not pointing to other type, we still want to query by it
    {key: "model", ref: "airplane_model"},
    {key: "manifacturer", ref: "airplane_manifacturer"},
]) { }


************************************************************************
* 8 refs, 1 UQ ref, + v_0 + ringToken = 11 TOTAL for 1 item; 20 Flight items: 220 items TOTAL
************************************************************************
export class _specs_FlightItem extends DynamoItem(_specs_Flight, "flight", [
    {key: "flight_code", unique:true},
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "tourist_season"}, // although not pointing to other type, we still want to query by it
    {key: "duration_hours"}, // although not pointing to other type, we still want to query by it
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"},
]) { }
======
47 v_0 items (i.e unique, separate entities)
======
425 dynamo records in total (i.e the unique items + all their copies, facilitating FKs/queries)
======
************************************************************************
* 9 refs, 1 UQ ref, + v_0 + ringToken = 12 TOTAL for 1 item; 200 Tourist items: 2400 items TOTAL
************************************************************************
export class _specs_TouristItem extends DynamoItem(_specs_Tourist, "tourist", [
    {key: "iban", unique:true},
    {key: "fname"},
    {key: "lname"},
    {key: "airplane", ref:"airplane"},
    {key: "from_airport", ref:"airport"},
    {key: "to_airport", ref:"airport"},
    {key: "flight", ref: "flight"}, 
    {key: "from_country", ref: "country"},
    {key: "to_country", ref: "country"}]) { }
======
425 + 2400 = 2825 dynamo records in total (when TOTAL_TOURISTS=200)
======
