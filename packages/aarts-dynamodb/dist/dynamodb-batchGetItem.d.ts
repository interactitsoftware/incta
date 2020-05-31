import { DynamoItemKey, DynamoItem } from './BaseItemManager';
export declare const batchGetItem: <T extends DynamoItemKey>(items: T[]) => Promise<DynamoItem[]>;
