import { Context } from "aws-lambda";
import { AartsEvent } from "aarts-types/interfaces";
export declare const handler: (input: AartsEvent, context: Context) => Promise<any>;
export declare function processPayload(input: AartsEvent, context?: Context): Promise<any>;
export declare function processPayloadAsync(input: AartsEvent): AsyncGenerator<AartsEvent, AartsEvent, undefined>;
