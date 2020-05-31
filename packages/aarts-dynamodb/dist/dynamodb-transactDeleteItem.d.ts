import { DynamoItem, RefKey } from './BaseItemManager';
export declare const transactDeleteItem: (existingItem: DynamoItem, __item_refkeys: RefKey<DynamoItem>[]) => Promise<DynamoItem>;
