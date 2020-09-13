import { Context } from "aws-lambda";
import { AartsEvent } from "aarts-types/interfaces";
export declare const handler: (evnt: AartsEvent, context: Context) => Promise<any>;
export declare function processPayload(evnt: AartsEvent, context?: Context): Promise<any>;
export declare function processPayloadAsync(evnt: AartsEvent): AsyncGenerator<AartsEvent, AartsEvent, undefined>;
