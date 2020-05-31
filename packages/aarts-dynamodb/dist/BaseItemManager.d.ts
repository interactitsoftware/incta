import { AnyConstructor, Mixin } from "aarts-types/Mixin";
import { AartsPayload, IIdentity, IItemManager } from "aarts-types/interfaces";
export declare type DomainItem = Record<string, any>;
export interface DdbQueryInput {
    pk: string;
    range?: string | number | {
        min: string | number;
        max: string | number;
    };
    primaryKeyName: string;
    rangeKeyName: string;
    ddbIndex: string;
    filter?: {
        key: string;
        predicate: string;
        value: string;
    }[];
    limit?: number;
    paginationToken?: DdbItemKey;
}
export interface DdbItemKey {
    id: string;
    meta: string;
    smetadata?: string;
    nmetadata?: number;
}
export interface DdbQueryOutput {
    items?: Record<string, any>[];
    count?: number;
    lastEvaluatedKey: DdbItemKey;
}
export declare type RefKey<T extends DomainItem> = {
    key: keyof IBaseDynamoItemProps | keyof T;
    ref?: string;
    unique?: boolean;
};
export interface IBaseDynamoItemProps {
    id: string;
    item_type: string;
    item_state?: string;
    state_history?: Record<number, string>;
    revisions: number;
    checksum?: string;
    user_created?: string;
    user_updated?: string;
    date_created: string;
    date_updated: string;
}
export interface DynamoItemKey {
    id: string;
    meta: string;
}
export declare const DynamoItem: <T extends AnyConstructor<Record<string, any>>>(base: T, t: string, refkeys?: RefKey<InstanceType<T>>[] | undefined) => {
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
    __refkeys: RefKey<InstanceType<T>>[];
} & T;
export declare type DynamoItem = Mixin<typeof DynamoItem>;
export declare type ExistingDynamoItem = Mixin<typeof DynamoItem & DynamoItemKey & DomainItem>;
export declare class BaseDynamoItemManager<T extends DynamoItem> implements IItemManager<T> {
    private lookupItems;
    constructor(lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>);
    start(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
    /**
     * implemeneted in client item managers - can add or ammend a query according to business logic
     * @param args
     * @param identity
     */
    validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<string, DdbQueryInput, undefined>;
    /**
     * T here is DdbQueryInput. TODO improve generics
     * @param args holds gate checkins, transforming incomming args for dynamodb query
     * @param identity
     */
    baseValidateQuery(args: DdbQueryInput[], identity: IIdentity): AsyncGenerator<string, DdbQueryInput, undefined>;
    /**
     * PK
     * RANGE
     * dynamo index name
     * filter
     * limit (page size)
     * pagetoken (page nr)
     *
     * @param item
     * @param args
     */
    query(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
    /**
     *
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity
     */
    validateDelete(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined>;
    /**
     *
     * @param __type gate checks for Update
     * @param payload
     */
    baseValidateDelete(__type: string, payload: AartsPayload): AsyncGenerator<string, AartsPayload, undefined>;
    /**
     * making use of dynamodb transactwriteItems. Making update requests
     * @param __type
     * @param args
     */
    delete(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
    /**
     * implemented in client item managers
     * @param args
     * @param identity
     */
    validateGet(args: DynamoItemKey[], identity: IIdentity): AsyncGenerator<string, DynamoItemKey[], undefined>;
    /**
     *
     * @param args holds get checkins, transforming incomming args for dynamodb getItem
     * @param identity
     */
    baseValidateGet(args: T[], identity: IIdentity): AsyncGenerator<string, DynamoItemKey[], undefined>;
    /**
     * making use of dynamodb batchGetItems
     * @param item
     * @param args
     */
    get(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
    /**
     *
     * @param item implemented in client item managers
     * @param identity
     */
    validateCreate(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined>;
    /**
     *
     * @param __type gate checks for CREATE
     * @param payload
     */
    baseValidateCreate(__type: string, payload: AartsPayload): AsyncGenerator<string, AartsPayload, undefined>;
    /**
     * making use of dynamodb transactWriteItems, making a put requests for each element from incomming arguments array
     * @param item the item type
     * @param args initialization parameters. Each element in the array will result in a separate item created
     */
    create(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
    /**
     *
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity
     */
    validateUpdate(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined>;
    /**
     *
     * @param __type gate checks for Update
     * @param payload
     */
    baseValidateUpdate(__type: string, payload: AartsPayload): AsyncGenerator<string, AartsPayload, undefined>;
    /**
     * making use of dynamodb transactwriteItems. Making update requests
     * @param __type
     * @param args
     */
    update(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
    save(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>;
}
