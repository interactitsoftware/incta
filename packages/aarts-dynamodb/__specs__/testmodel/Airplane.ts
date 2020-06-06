import { TestModel_Nomenclature } from "./Nomenclature"

export class TestModel_AirplaneModel extends TestModel_Nomenclature { 
    public manifacturer:string = "unknown"
}

export class TestModel_AirplaneManifacturer extends TestModel_Nomenclature { 
    public country: string = "unknown"
}

export class TestModel_Airplane {
    
    constructor (...args: any[]) {}

    //--ref keys
    public reg_uq_str?: string
    public reg_uq_number?: number
    public model?: string
    public manifacturer?: string
    //--rest of keys
    public number_of_seats?: number
}
