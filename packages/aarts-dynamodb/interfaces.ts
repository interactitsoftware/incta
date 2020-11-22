import { AartsEvent } from "aarts-types/interfaces";

export interface DdbTableItemKey {
    id: string
    meta?: string
}
export interface DdbGSIItemKey { id: string, meta: string, smetadata?: string, nmetadata?: number }

export interface IBaseDynamoItemProps {

    id: string

    __typename: string
    item_state?: string
    state_history?: Record<number, string>
    revisions: number
    checksum?: string

    user_created?: string
    user_updated?: string
    date_created: string
    date_updated: string
    ringToken?: string
}

export interface DdbQueryInput extends DdbLoadPeersInput{
    pk: string | number
    range?: string | number | {min:string|number, max:string|number}
    primaryKeyName: string
    rangeKeyName: string
    ddbIndex: string
    filter?: {
        key: string
        predicate: string
        value: string | number
    }[],
    limit?: number
    paginationToken?: DdbGSIItemKey
    ringToken: string
} 

export interface DdbGetInput extends DdbLoadPeersInput{
    pks: DdbTableItemKey[],
    ringToken: string
}

export interface DdbLoadPeersInput {
    loadPeersLevel?: number
    peersPropsToLoad?: string[]
    projectionExpression?: string
    selectionSetGraphQL?: string
}

export interface IProcedure<T> {
    start(__type: string, args: AartsEvent) : T
}
export type DomainItem = Record<string, any>
export type RefKey<T extends DomainItem> = { key: keyof IBaseDynamoItemProps | keyof T, ref?: string, unique?: boolean }

