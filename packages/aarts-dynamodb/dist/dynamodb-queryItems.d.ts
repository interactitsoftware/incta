import { DdbQueryInput, DdbQueryOutput } from 'aarts-types/interfaces';
export declare const queryItems: <T extends DdbQueryInput>(ddbQueryPayload: T) => Promise<DdbQueryOutput>;
