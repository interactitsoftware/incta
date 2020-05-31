import { RefKey } from './BaseItemManager';
export declare const transactPutItem: <T extends Record<string, any> & {
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
}>(item: T, __item_refkeys: RefKey<T>[]) => Promise<T>;
