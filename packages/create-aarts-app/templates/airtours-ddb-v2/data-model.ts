export const model = {
  "version": 2,
  "Items": {
    "Country": {
      "name": { "type": "string", "gsiKey": ["sPK1"], "unique": true, "indexed": true },
      "currency": { "type": "string" },
      "code": { "type": "string", "gsiKey": ["sPK2"], "unique": true, "indexed": true },
      "tax_periods": {
        "type": "string",
        "DESC": "Holds a stringified representation of the report periods for a particular country"
      }
    },
    "Airport": {
      "name": { "type": "string", "gsiKey": ["sPK1"], "unique": true, "indexed": true },
      "airport_size": { "type": "number", "gsiKey": ["nSK1"], "indexed": true },
      "country": { "type": "string", "gsiKey": ["sPK2"], "ref": "Country", "indexed": true },
      "branch": { "type": "string", "gsiKey": ["sPK3"], "indexed": true },
      "type": { "type": "string", "gsiKey": ["sPK4"], "indexed": true },
      "code": { "type": "string", "gsiKey": ["sPK5"], "indexed": true }
    },
    "Flight": {
      "airplane": { "type": "string", "gsiKey": ["sPK1"], "ref": "Airplane", "indexed": true },
      "from_airport": { "type": "string", "gsiKey": ["sPK2"], "ref": "Airport", "indexed": true },
      "to_airport": { "type": "string", "gsiKey": ["sPK3"], "ref": "Airport", "indexed": true },
      "from_country": { "type": "string", "gsiKey": ["sPK4"], "ref": "Country", "indexed": true },
      "to_country": { "type": "string", "gsiKey": ["sPK5"], "ref": "Country", "indexed": true },
      "flight_code": { "type": "string", "gsiKey": ["sPK6"], "unique": true, "indexed": true },
      "duration_hours": { "type": "number", "gsiKey": ["nSK1"], "indexed": true },
      "tourist_season": { "type": "string", "gsiKey": ["sPK7"], "ref": "TouristSeason", "indexed": true },
      "price_1st_class": { "type": "number" },
      "price_2nd_class": { "type": "number" },
      "price_vip": { "type": "number" }
    },
    "Airplane": {
      "reg_uq_str": { "type": "string", "gsiKey": ["sPK1"], "unique": true, "indexed": true },
      "reg_uq_number": { "type": "number", "gsiKey": ["nSK1"], "unique": true, "indexed": true },
      "number_of_seats": { "type": "number", "gsiKey": ["nSK2"], "indexed": true },
      "model": { "type": "string", "gsiKey": ["sPK2"], "ref": "AirplaneModel", "indexed": true },
      "manifacturer": { "type": "string", "gsiKey": ["sPK3"], "ref": "AirplaneManifacturer", "indexed": true },
      "country": { "type": "string", "gsiKey": [ "sPK4" ], "ref": "Country", "indexed": true }
    },
    "AirplaneModel": {
      "manifacturer": { "type": "string", "gsiKey": ["sPK1"], "ref": "AirplaneManifacturer", "indexed": true },
      "country": { "type": "string", "ref": "Country", "indexed": true },
      "name": { "type": "string", "gsiKey": ["sPK2"], "unique": true, "indexed": true }
    },
    "AirplaneManifacturer": {
      "country": { "type": "string", "gsiKey": ["sPK1"], "ref": "Country", "indexed": true },
      "name": { "type": "string", "gsiKey": ["sPK2"], "unique": true, "indexed": true }
    },
    "Tourist": {
      "fname": { "type": "string", "gsiKey": ["sPK1"], "indexed": true },
      "lname": { "type": "string", "gsiKey": ["sPK2"], "indexed": true },
      "id_card": { "type": "number", "gsiKey": ["nPK1"], "unique": true, "indexed": true },
      "iban": { "type": "string", "gsiKey": ["sPK3"], "unique": true, "required": true, "indexed": true },
      "tourist_season": { "type": "string", "gsiKey": ["sPK4"], "ref": "TouristSeason", "indexed": true },
      "ticket_type": { "type": "string", "gsiKey": ["sPK5"], "indexed": true },
      "airplane": { "type": "string", "gsiKey": ["sPK6"], "ref": "Airplane", "indexed": true },
      "flight": { "type": "string", "gsiKey": ["sPK7"], "ref": "Flight", "indexed": true },
      "from_airport": { "type": "string", "gsiKey": ["sPK8"], "ref": "Airport", "indexed": true },
      "to_airport": { "type": "string", "gsiKey": ["sPK9"], "ref": "Airport", "indexed": true },
      "from_country": { "type": "string", "gsiKey": ["sPK10"], "ref": "Country", "indexed": true },
      "to_country": { "type": "string", "gsiKey": ["sPK11"], "ref": "Country", "indexed": true }
    },
    "TouristSeason": {
      "discounts": {
        "vip": {
          "type": "number"
        },
        "class_2": {
          "type": "number"
        },
        "class_1": {
          "type": "number"
        }
      },
      "code": {
        "type": "string",
        "gsiKey": ["sPK1"],
        "unique": true,
        "indexed": true
      },
      "price_flight_per_hour": {
        "type": "number"
      }
    },
    "Invoice": {
      "invoice_nr": {
        "type": "string",
        "gsiKey": ["sPK1"],
        "indexed": true
      },
      "id_card": {
        "type": "string",
        "gsiKey": ["sPK2"],
        "indexed": true
      },
      "tourist": {
        "type": "string",
        "gsiKey": ["sPK3"],
        "ref": "Tourist",
        "indexed": true
      },
      "lname": {
        "type": "string"
      },
      "fname": {
        "type": "string"
      },
      "address1": {
        "type": "string"
      },
      "address2": {
        "type": "string"
      }
    },
    "Order": {
      "invoice": {
        "type": "string",
        "gsiKey": ["sPK1"],
        "ref": "Invoice",
        "indexed": true
      },
      "flight": {
        "type": "string",
        "gsiKey": ["sPK2"],
        "ref": "Flight",
        "indexed": true
      },
      "tourist_season": {
        "type": "string",
        "gsiKey": ["sPK3"],
        "ref": "TouristSeason",
        "indexed": true
      },
      "price": {
        "type": "number"
      },
      "quantity": {
        "type": "number"
      },
      "discount": {
        "type": "number"
      },
      "vat": {
        "type": "number"
      }
    }
  },
  "Commands": {
    "EraseData": {},
    "GenerateAirtoursData": {
      "total_events": {
        "type": "number",
        "gsiKey": ["nSK1"],
        "indexed": true
      },
      "useNamesLength": {
        "type": "number"
      },
      "touristsToCreate": {
        "type": "number"
      },
      "on_success": {
        "type": "string[]"
      }
    },
    "GenerateTouristsReservations": {
      "total_events": {
        "type": "number",
        "gsiKey": ["nSK1"],
        "indexed": true
      },
      "noUniqueIdCardFields": {
        "type": "boolean"
      },
      "noUniqueIbanFields": {
        "type": "boolean"
      },
      "simulateErrors": {
        "type": "boolean"
      },
      "touristsToCreate": {
        "type": "number"
      },
      "useNamesLength": {
        "type": "number"
      },
      "fname": {
        "type": "string | string[]"
      },
      "lname": {
        "type": "string | string[]"
      },
      "iban": {
        "type": "string | string[]"
      },
      "toAirport": {
        "type": "string | string[]"
      },
      "fromAirport": {
        "type": "string | string[]"
      },
      "toCountry": {
        "type": "string | string[]"
      },
      "fromCountry": {
        "type": "string | string[]"
      },
      "airplane": {
        "type": "string | string[]"
      },
      "flight": {
        "type": "string | string[]"
      }
    },
    "ConfirmTouristsReservations": {
      "total_events": {
        "type": "number",
        "gsiKey": ["nSK1"],
        "indexed": true
      },
      "cancelledReservations": {
        "type": "string[]"
      },
      "touristSeason": {
        "type": "string"
      }
    },
    "GenerateInvoices": {
      "total_events": {
        "type": "number",
        "gsiKey": ["nSK1"],
        "indexed": true
      }
    }
  },
  "Queries": {
    "FlightsInvolvingCountry": {
      "country": {
        "type": "string"
      }
    },
    "AllTouristForTouristSeason": {
      "touristSeason": {
        "type": "string"
      }
    }
  },
  "GSIs": [
    "nshard__smetadata",
    "smetadata__",
    "smetadata__nSK1",
    "smetadata__nSK2",
    "nPK1__smetadata",
    "sPK10__smetadata",
    "sPK11__smetadata",
    "sPK1__smetadata",
    "sPK2__smetadata",
    "sPK3__smetadata",
    "sPK4__smetadata",
    "sPK5__smetadata",
    "sPK6__smetadata",
    "sPK7__smetadata",
    "sPK9__smetadata",
    "sPK8__smetadata"
  ]
}