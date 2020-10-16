import { Context, SQSEvent } from "aws-lambda";
export declare const feeder: (event: SQSEvent, context: Context) => Promise<any>;
