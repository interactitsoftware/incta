import { DomainItem, DynamoItem } from "../BaseItemManager";
export declare const stripCreatedUpdatedDates: (obj: DynamoItem & DomainItem) => Record<string, any>;
export declare const clearDynamo: () => Promise<void>;
export declare const getBy_meta__smetadata: (meta: string, smetadata: string) => import("aws-sdk").Request<import("aws-sdk/clients/dynamodb").QueryOutput, import("aws-sdk").AWSError>;
export declare const getBy_meta__nmetadata: (meta: string, nmetadata: number) => import("aws-sdk").Request<import("aws-sdk/clients/dynamodb").QueryOutput, import("aws-sdk").AWSError>;
export declare const getBy_smetadata__meta: (meta: string, smetadata: string) => void;
export declare const getBy_nmetadata__meta: (meta: string, smetadata: string) => void;
