import { AnyConstructor } from "./Mixin"
import { StreamRecord } from "aws-lambda";

export type IIdentity = any
export type IItemManagerKeys = keyof IItemManager<any>

export interface AartsEvent {
    payload: AartsPayload
    meta: AartsMeta
    eventType?: "output" | "input" | undefined
    jobType?: "short" | "long" | undefined
}

export interface AartsMeta {
    item: string,
    action: IItemManagerKeys,
    ringToken: string,
    eventSource: string,
    sqsMsgId?: string,
    sqsReceiptHandle?: string,
    approximateReceiveCount?: number
}

export interface AartsPayload<T = any> {
    arguments?: any
    identity?: any
    result?: DBQueryOutput<T> | T
    selectionSetList?: string
}

export interface DBQueryOutput<T> {
    items: T[],
    nextPage?: any
}

export interface IDomainAdapter<BASE_ITEM> {
    lookupItems: Map<string, AnyConstructor<BASE_ITEM>>
    itemManagers: { [key: string]: IItemManager<BASE_ITEM> }
    itemManagerCallbacks: { [key: string]: IItemManagerCallback<BASE_ITEM> }
}

export interface IItemManager<TItem = any> {

    // All methods should have the same signature
    // in order to be able to be called by a loookup based on the action attribute sent inside the messageAttributes of an SQS message

    // this is why for example the create is resolving not just to DynamoItems (=TItem[]) (which is only of interest)
    // but is also carying the identity (=AartsPayload) - > TODO revise this, return objects may be narrowed down
    create(args: AartsEvent): AsyncGenerator<string, AartsPayload<TItem>, undefined>
    update(args: AartsEvent): AsyncGenerator<string, AartsPayload<TItem>, undefined>
    delete(args: AartsEvent): AsyncGenerator<string, AartsPayload<TItem>, undefined>
    start(args: AartsEvent): AsyncGenerator<string, AartsPayload<TItem>, undefined>
    get(args: AartsEvent): AsyncGenerator<string, AartsPayload<TItem>, undefined>
    query(args: AartsEvent): AsyncGenerator<string, AartsPayload<TItem>, undefined>
}

export interface IItemManagerCallback<TItem = any> {

    // All methods should have the same signature
    // in order to be able to be called by a loookup based on the action attribute sent inside the messageAttributes of an SQS message
    _onCreate(item: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void>
    _onUpdate(item: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void>
    _onSuccess(item: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void>
    _onError(item: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void>
}

export interface DataModel {
    version: number,
    Items: { [x: string]: DataModelObject }
    Commands: { [x: string]: DataModelObject }
    Queries: { [x: string]: DataModelObject }
    GSIs: string[]
}
export type ItemPropertyValue = {
    unique?: boolean
    required?: boolean
    indexed?: boolean
    gsiKey?: string[]
    ref?: string
    type: string
}

export interface DataModelObject {
    [x: string]: ItemPropertyValue | DataModelObject
}