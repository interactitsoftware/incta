import { TestModel_Nomenclature } from "./Nomenclature"

export class TestModel_AirplaneModel extends TestModel_Nomenclature { }

export class TestModel_AirplaneManifacturer extends TestModel_Nomenclature { }

export class TestModel_Airplane {
    //--ref keys
    public unique_id_str?: string
    public unique_id_nr?: number
    public home_airport?: string
    public country?: string
    public model?: string
    public manifacturer?: string
    //--rest of keys
    public number_of_seats?: number
}
