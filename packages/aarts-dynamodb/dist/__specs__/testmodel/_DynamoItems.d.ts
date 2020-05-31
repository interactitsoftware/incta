import { RefKey } from "../../BaseItemManager";
import { TestModel_Airport } from "./Airport";
import { TestModel_Flight } from "./Flight";
import { TestModel_Airplane, TestModel_AirplaneModel, TestModel_AirplaneManifacturer } from "./Airplane";
import { TestModel_Country } from "./Country";
export declare const TestModel_FlightRefkeys: RefKey<TestModel_Flight>[];
declare const TestModel_FlightItem_base: {
    new (...args: any[]): {
        [x: string]: any;
        id: string;
        meta: string;
        item_type: string;
        item_state?: string | undefined;
        state_history?: Record<number, string> | undefined;
        revisions: number;
        checksum?: string | undefined;
        user_created?: string | undefined;
        user_updated?: string | undefined;
        date_created: string;
        date_updated: string;
    };
    __type: string;
    __refkeys: RefKey<TestModel_Flight>[];
} & typeof TestModel_Flight;
export declare class TestModel_FlightItem extends TestModel_FlightItem_base {
}
export declare const TestModel_AirplaneRefkeys: RefKey<TestModel_Airplane>[];
declare const TestModel_AirplaneItem_base: {
    new (...args: any[]): {
        [x: string]: any;
        id: string;
        meta: string;
        item_type: string;
        item_state?: string | undefined;
        state_history?: Record<number, string> | undefined;
        revisions: number;
        checksum?: string | undefined;
        user_created?: string | undefined;
        user_updated?: string | undefined;
        date_created: string;
        date_updated: string;
    };
    __type: string;
    __refkeys: RefKey<TestModel_Airplane>[];
} & typeof TestModel_Airplane;
export declare class TestModel_AirplaneItem extends TestModel_AirplaneItem_base {
}
declare const TestModel_AirplaneModelItem_base: {
    new (...args: any[]): {
        [x: string]: any;
        id: string;
        meta: string;
        item_type: string;
        item_state?: string | undefined;
        state_history?: Record<number, string> | undefined;
        revisions: number;
        checksum?: string | undefined;
        user_created?: string | undefined;
        user_updated?: string | undefined;
        date_created: string;
        date_updated: string;
    };
    __type: string;
    __refkeys: RefKey<TestModel_AirplaneModel>[];
} & typeof TestModel_AirplaneModel;
export declare class TestModel_AirplaneModelItem extends TestModel_AirplaneModelItem_base {
}
declare const TestModel_AirplaneManifacturerItem_base: {
    new (...args: any[]): {
        [x: string]: any;
        id: string;
        meta: string;
        item_type: string;
        item_state?: string | undefined;
        state_history?: Record<number, string> | undefined;
        revisions: number;
        checksum?: string | undefined;
        user_created?: string | undefined;
        user_updated?: string | undefined;
        date_created: string;
        date_updated: string;
    };
    __type: string;
    __refkeys: RefKey<TestModel_AirplaneManifacturer>[];
} & typeof TestModel_AirplaneManifacturer;
export declare class TestModel_AirplaneManifacturerItem extends TestModel_AirplaneManifacturerItem_base {
}
declare const TestModel_AirportItem_base: {
    new (...args: any[]): {
        [x: string]: any;
        id: string;
        meta: string;
        item_type: string;
        item_state?: string | undefined;
        state_history?: Record<number, string> | undefined;
        revisions: number;
        checksum?: string | undefined;
        user_created?: string | undefined;
        user_updated?: string | undefined;
        date_created: string;
        date_updated: string;
    };
    __type: string;
    __refkeys: RefKey<TestModel_Airport>[];
} & typeof TestModel_Airport;
export declare class TestModel_AirportItem extends TestModel_AirportItem_base {
}
declare const TestModel_CountryItem_base: {
    new (...args: any[]): {
        [x: string]: any;
        id: string;
        meta: string;
        item_type: string;
        item_state?: string | undefined;
        state_history?: Record<number, string> | undefined;
        revisions: number;
        checksum?: string | undefined;
        user_created?: string | undefined;
        user_updated?: string | undefined;
        date_created: string;
        date_updated: string;
    };
    __type: string;
    __refkeys: RefKey<TestModel_Country>[];
} & typeof TestModel_Country;
export declare class TestModel_CountryItem extends TestModel_CountryItem_base {
}
export {};
