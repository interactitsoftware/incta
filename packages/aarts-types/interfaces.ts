
export type IIdentity = any
export type IItemManagerKeys = keyof IItemManager<any>

export interface AartsEvent {
	payload: AartsPayload
    meta: AartsMeta
    resultType?: "output" | "input" | undefined,
    taskType?: "s" | "l" | undefined,
}
export interface AartsMeta {
    item: string,
    action: IItemManagerKeys,
    ringToken: string,
    eventSource: string
}

export interface AartsPayload<T = any> {
    arguments: any;
    identity: any;
    resultItems?: T[]
}
export interface IDomainAdapter<BASE_ITEM> {
    itemManagers: { [key: string]: IItemManager<BASE_ITEM> }
}

export interface IItemManager<TItem = any> {

    // All methods should have the same signature
    // in order to be able to be called by a loookup based on the action attribute sent inside the messageAttributes of an SQS message
    
    // this is why for example the create is resolving not just to DynamoItems (=TItem[]) (which is only of interest)
    // but is also carying the identity (=AartsPayload) - > TODO revise this, return objects may be narrowed down
    create(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<TItem>, AartsPayload<TItem>, undefined>
    update(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<TItem>, AartsPayload<TItem>, undefined>
    delete(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<TItem>, AartsPayload<TItem>, undefined>
    start(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<TItem>, AartsPayload<TItem>, undefined>
    get(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<TItem>, AartsPayload<TItem>, undefined>
    query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<TItem>, AartsPayload<TItem>, undefined>
}