
export type IIdentity = any
export type IItemManagerKeys = keyof IItemManager<any>

export interface AartsEvent {
	payload: AartsPayload
	meta: AartsMeta
}
export interface AartsMeta {
    item: string,
    action: IItemManagerKeys,
    ringToken: string,
    eventSource: string
}
export interface AartsPayload {
    arguments: any,
    identity: any,
}

export interface DdbQueryInput {
    pk: string | number,
    range?: string | number | {min:string|number, max:string|number},
    primaryKeyName: string,
    rangeKeyName: string,
    ddbIndex: string,
    filter?: {
        key: string,
        predicate: string,
        value: string | number
    }[],
    limit?: number,
    paginationToken?: DdbItemKey
} 

export interface DdbItemKey {id: string, meta: string, smetadata?: string, nmetadata?: number}

export interface DdbQueryOutput {
    items?: Record<string, any>[],
    count?: number,
    lastEvaluatedKey: DdbItemKey
}

export interface AartsProcedure {
    start(): Promise<AartsEvent>
}

export interface IDomainAdapter<BASE_ITEM> {
    itemManagers: { [key: string]: IItemManager<BASE_ITEM> }
}

export interface IItemManager<TItem> {

    // THE trickery here is that all methods should have the same signature
    // in order to be able to be called from a loookup by sqs attribute action
    
    // this is why for example the create is resolving not just to DynamoItems (=TItem[]) (which is only of interest)
    // but is also carying the identity (=BusEventPaload)
    create(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>
    update(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>
    delete(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>
    start(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>
    get(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>
    query(item: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload, undefined>

        // get(id: string) : Promise<TItem>
    // list() : Promise<[TItem]>

    // validateCreate(args: TItem) : Promise<TItem | undefined>
    // validateUpdate(args: TItem) : Promise<TItem | undefined>
    // validateDelete(args: TItem) : Promise<TItem | undefined>



}