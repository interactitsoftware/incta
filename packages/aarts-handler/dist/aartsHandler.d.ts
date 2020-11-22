import { Context } from "aws-lambda";
import { AartsEvent, AartsPayload } from "aarts-types/interfaces";
export declare const handler: (evnt: AartsEvent, context: Context) => Promise<any>;
export declare function processPayload(evnt: AartsEvent, context?: Context): Promise<AartsPayload>;
export declare function processPayloadAsync(evnt: AartsEvent): AsyncGenerator<string, AartsPayload, never>;
