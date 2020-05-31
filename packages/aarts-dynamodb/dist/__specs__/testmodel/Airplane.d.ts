import { TestModel_Nomenclature } from "./Nomenclature";
export declare class TestModel_AirplaneModel extends TestModel_Nomenclature {
}
export declare class TestModel_AirplaneManifacturer extends TestModel_Nomenclature {
}
export declare class TestModel_Airplane {
    home_airport?: string;
    country?: string;
    model?: string;
    manifacturer?: string;
    number_of_seats?: number;
}
