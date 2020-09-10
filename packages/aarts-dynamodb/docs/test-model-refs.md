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

total amount of events in the TEST queue:
-----------------------------------------------
single_lambda_test_data_generator(with TOTAL_TOURISTS=200):
-----------------------------------------------
when DEBUGGER env var is set to 0 or missing: 1
when DEBUGGER env var is set to 1: 1993

benchmarks:
inserting 2000 tourists: 116959.78 ms
inserting 2000 tourists: 108315.75 ms

inserting 20000 tourists 600100.42 ms HIT 10 min timeout, inserted 150473 EXPEXTED 240425
inserting 20000 tourists 600100 ms HIT 10 min timeout, inserted 160277 EXPEXTED 240425
-------------------------------------------
-------------------------------------------

-----------------------------------------------
multiple_lambda_test_data_generator(with TOTAL_TOURISTS=200, i.e 200 events more):
-----------------------------------------------
when DEBUGGER env var is set to 0 or missing: 201
when DEBUGGER env var is set to 1: 2193

benchmarks:
inserting 2000 tourists: 116959.78 ms
inserting 2000 tourists: 108315.75 ms

1 try: inserting 20000 tourists xyz ms HIT 10 min timeout ON THE procedure start - because of await on publish msgs. 20k publishes took more than 10 mins + insert of 425 records above. inserted 167753 EXPEXTED 240425 BUT received msgs(13945) in SQS match because: 167753(total inserted recs in dynamo)-425(those for airports etc)=167328(records for toursists only). 167328/12(dynamo records per tourist)=13944 WHICH is equal to 13945-1(amount of messages received in SQS for tourist:create) (from the procedure start event)
2 try: inserting 20000 tourists xyz ms HIT 10 min timeout ON THE procedure start - because of await on publish msgs. 20k publishes took more than 10 mins + insert of 425 records above. iserted 166673 ...^^ as above ^^...
