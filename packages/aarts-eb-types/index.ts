

export { prepareAartsEventForDispatch } from "./prepareAartsEventForDispatch"
export { prepareAppSyncEventForDispatch } from "./prepareAppSyncEventForDispatch"
export * from "./BusUtil"

// caution, if you need delays, probably there is something else to be done better
// protected async delay(result: any, ms: number): Promise<{ [key: string]: any }> {
//     return new Promise(resolve => setTimeout(() => resolve(result), ms));
// }








