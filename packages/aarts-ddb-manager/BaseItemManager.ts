import { DB_NAME, dynamoDbClient, fromAttributeMap, RefKey, transformGraphQLSelection, versionString } from "aarts-ddb";
import { DynamoItem } from "aarts-ddb/DynamoItem"
import { batchGetItem } from "aarts-ddb";
import { transactUpdateItem } from "aarts-ddb";
import { transactPutItem } from "aarts-ddb";
import { queryItems } from "aarts-ddb";
import { transactDeleteItem } from "aarts-ddb";
import { AnyConstructor, MixinConstructor } from "aarts-types/Mixin"
import { ppjson, loginfo, chunks, uuid } from "aarts-utils"
import { AartsEvent, AartsPayload, IIdentity, IItemManager, IItemManagerKeys } from "aarts-types/interfaces"
import { DdbQueryInput, DdbTableItemKey, DomainItem, DdbGetInput } from "aarts-ddb";
import { StreamRecord } from "aws-lambda";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { getItemById } from "aarts-ddb";
import { AppSyncEvent } from "aarts-eb-types"
import { controller } from "aarts-eb-dispatcher"
import { processPayload } from "aarts-eb-handler";
import { DBQueryOutput } from 'aarts-types';

/**++++++++++++++++++++++++++++++++++++++++++++++++++
 * ++++++++++++++++++++++++++++++++++++++++++++++++
 * VERSION 2
 * +++++++++++++++++++++++++++++++++++++++++++++++++++
 * +++++++++++++++++++++++++++++++++++++++++++++++++++
 * NOTE constructor does nothing here
 * Do not instantiate directly, Rather instantiate corresp command item
 */

export class DynamoCommandItem {
    constructor(...args: any[]) { }
    total_events?: number = 0
    start_date?: string
    sync_end_date?: string
    async_end_date?: string
    processed_events?: number
    errored_events?: number
    errors?: string
}

/**
 * TODO 
 * - [OK]remove the arrays support (which is anyways not completed and only cause chaos)
 * - [OK]remove *save method and directly call transactPut
 * - add if (__type == BASE) also for update method
 * - [OK]wrap the update also in a try catch for tracing __proc keys
 * - move loading up the item to update within transactUpdateMethod, for handling optimistic locking better?? Do we really want to update
 * - aarts-eb-handler to be configured to read in messages in batches, to catch any exceptions and rethrow them, deleting manually from sqs what was successful
 * - consider this try catch on some higher level?
 * - maintain DBmigration commands separatley from other commands
 * 
 * 
 * ---------------------
 * aarts-ddb2
 * 
 * -- [OK]load model in cdk
 * -- if dynamo-verion not present, assume version 1
 * -- if present create dynamo table accodingly:
 *  - if version 1 - create table and GSIs meta smetadata etc.
 *  - if version 2 - get all "index" fields and create "<index>__meta_state" GSI
 *  - update meta_state=meta+item_state
 *  - SHARD on meta prop
 * 
 * -- extend RefKey to store also the index property
 * -- when querying:
 *  - pass index name
 *  - pass pk (which is always the meta)
 *  - pass range
 *  - pass rangePredicate (either =, begins_with, exists, not exists, between), if not present assume =
 * 
 * -- batchGet and peersloading --> no change here
 */
export class BaseDynamoItemManager<T extends DynamoItem> implements IItemManager<T> {

    public lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>
    eventsForAsyncProcessing: AppSyncEvent[] = []

    constructor(lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>) {
        this.lookupItems = lookupItems
    }

    public onCreate: Function | undefined
    public onUpdate: Function | undefined
    public onSuccess: Function | undefined
    public onError: Function | undefined

    //#region STREAMS CALLBACKS
    async _onCreate(__type: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void> {
        if (dynamodbStreamRecord !== undefined) {
            const newImage = fromAttributeMap(dynamodbStreamRecord?.NewImage as AttributeMap) as DynamoItem
            if (!newImage.meta.startsWith(versionString(0))) {
                // break from cycle: dynamodb update -> stream event ->dynamodb update -> etc.. 
                return
            }
            !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, "_onCreate CALL BACK FIRED for streamRecord ", ppjson(newImage))

            if (typeof this.onCreate === "function") {
                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, "CALLING ON CREATE CALL BACK for item ", newImage.__typename)
                await this.onCreate(__type, newImage)
            } else {
                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, `No specific onCreate method was found in manager of ${__type}`)
            }
        }
    }
    async _onUpdate(__type: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void> {
        if (dynamodbStreamRecord !== undefined) {
            const newImage = fromAttributeMap(dynamodbStreamRecord?.NewImage as AttributeMap) as DynamoItem
            !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, "_onUpdate CALL BACK FIRED for streamRecord ", ppjson(newImage))

            // mark procedures as done when total_events=processed_events
            if (newImage.id.startsWith("P__") && (newImage.revisions >= 1)
                && (newImage["processed_events"] as number) + (newImage["errored_events"] as number) === (newImage["total_events"] as number)
                //NEW WAY: when all retries finished
                && ! (newImage["item_state"] === "success" || newImage["item_state"] === "error")) {

                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, `ISSUING UPDATE-${(newImage["processed_events"] as number) === (newImage["total_events"] as number) ? 'SUCCESS' : 'ERROR'} TO PROCEDURE`, ppjson(newImage))
                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, `newImage["processed_events"] ${newImage["processed_events"] as number} ; newImage["errored_events"] ${newImage["errored_events"] as number} ; newImage["total_events"]: ${newImage["total_events"] as number}`)
                const P__from_db = await getItemById(newImage.__typename, newImage.id, newImage.ringToken as string)
                if (!!P__from_db) {
                    try { 
                        await transactUpdateItem(
                            P__from_db,
                            {
                                end_date: new Date().toISOString(),
                                item_state: `${(newImage["processed_events"] as number) === (newImage["total_events"] as number) ? 'success' : 'error'}`,
                                // OLD WAY: item_state: `${!newImage["errored_events"] || (newImage["errored_events"] as number) === 0 ? 'success' : 'error'}`,
                                ringToken: newImage.ringToken,
                                revisions: P__from_db.revisions,
                                id: newImage.id,
                                meta: newImage.meta,
                            },
                            (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
                    } catch (err) {
                        console.error("ERROR updating P__ ", ppjson(err), ppjson(P__from_db))
                        throw err
                    }
                }
            }

            console.log("CHECKING this.onUpdate ", ppjson(this.onUpdate))
            if (typeof this.onUpdate === "function") {
                await this.onUpdate(__type, newImage)
            } else {
                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, `No specific onUpdate method was found in manager of ${__type}`)
            }
        }
    }

    async _onSuccess(__type: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void> {
        if (dynamodbStreamRecord !== undefined) {
            const newImage = fromAttributeMap(dynamodbStreamRecord?.NewImage as AttributeMap) as DynamoItem
            !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, "_onSuccess CALL BACK FIRED for streamRecord ", ppjson(newImage))

            console.log("CHECKING this.onSuccess ", ppjson(this.onSuccess))
            if (typeof this.onSuccess === "function") {
                await this.onSuccess(__type, newImage)
            } else {
                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, `No specific onSuccess method was found in manager of ${__type}`)
            }
        }
    }

    async _onError(__type: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void> {
        if (dynamodbStreamRecord !== undefined) {
            const newImage = fromAttributeMap(dynamodbStreamRecord?.NewImage as AttributeMap) as DynamoItem
            !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, "_onError CALL BACK FIRED for streamRecord ", ppjson(newImage))

            console.log("CHECKING this.onError ", ppjson(this.onError))
            if (typeof this.onError === "function") {
                await this.onError(__type, newImage)
            } else {
                !process.env.DEBUGGER || loginfo({ ringToken: newImage.ringToken as string }, `No specific onError method was found in manager of ${__type}`)
            }
        }
    }
    //#endregion

    //#region START
    /**
     * 
     * @param __type Base method called at the begginig of starting a procedure
     * Validates and decorates input with necessary props
     * @param args 
     */
    async __validateStart(evnt: AartsEvent): Promise<T> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:__validateStart] START. checking for mandatory item keys: `, ppjson(evnt.payload))

        if (Array.isArray(evnt.payload.arguments)) throw new Error("payload.arguments must not be an array!")

        const proto = this.lookupItems.get(evnt.meta.item)

        if (!proto) {
            throw new Error(`${evnt.meta.ringToken}: [${evnt.meta.item}:START] Not able to locate dynamo item prototype for item ${evnt.meta.item}`)
        }

        return Object.assign(
            new proto(evnt.payload.arguments) as T,
            {
                id: `${evnt.meta.item}|${evnt.meta.ringToken}`,
                ringToken: evnt.meta.ringToken
            })
    }

    /**
     * implemeneted in client item managers 
     * @param args 
     * @param identity 
     */
    async *validateStart(proc: T, identity: IIdentity, ringToken: string): AsyncGenerator<string, T, any> {
        return proc
    }

    /**
     * 
     * @param __type Domain Commands overwrite this method to implement command's logic
     * @param evnt 
     */
    async execute(proc: T, identity: IIdentity, ringToken: string): Promise<T> {
        return proc
    }

    async *start(evnt: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] Begin start method. Doing a gate check of payload. Received evnt: `, ppjson(evnt))

        let proc = await this.__validateStart(evnt)
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] proc object, after __validateStart processing it: ${ppjson(proc)}`)

        const asyncGenDomain = this.validateStart(proc, evnt.payload.identity, evnt.meta.ringToken)
        let processorDomain
        do {
            processorDomain = await asyncGenDomain.next()
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:validateStart] output: `, ppjson(processorDomain.value))
            !processorDomain.done && (yield processorDomain.value as string)
        } while (!processorDomain.done)

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] Procedure applicable for Starting: ${ppjson(processorDomain.done)}`)

        // SAVE STATE PRIOR starting - important is to be deterministic on number of events this proc will fire, as this is how we mark it done (comparing processed === total events)
        proc = await transactPutItem(proc, (this.lookupItems.get(evnt.meta.item) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] proc object, after putting in DB: ${ppjson(proc)}`)

        let procedureResult: DynamoItem & DynamoCommandItem = proc as DynamoItem & DynamoCommandItem
        try {
            const startDate = new Date()
            procedureResult = (await this.execute(proc, evnt.payload.identity, evnt.meta.ringToken)) as DynamoItem & DynamoCommandItem
            procedureResult.total_events = this.eventsForAsyncProcessing.length
            procedureResult.start_date = startDate.toISOString()
            if (this.eventsForAsyncProcessing.length > 0) {
                if (!process.env["AWS_SAM_LOCAL"]) {
                    // used runtime in aws
                    for (const chunk of chunks(this.eventsForAsyncProcessing, Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25))) {
                        console.log("__proc: " + proc.id)
                        await controller({
                            //"x" values not necessary here. Can it be deleted or for typescript not complaining to leave it ?
                            "forcePublishToBus": true,
                            "action": "x",
                            "item": "x",
                            "jobType": "long",
                            "ringToken": proc.ringToken as string,
                            "arguments": chunk.map(c => {
                                Object.assign(c, { ringToken: proc.ringToken })
                                if (Array.isArray(c.arguments)) {
                                    c.arguments.forEach(arg => {
                                        Object.assign(arg, { ringToken: proc.ringToken })
                                        Object.assign(arg.arguments, { __proc: proc.id, ringToken: proc.ringToken })
                                    })
                                } else {
                                    Object.assign(c.arguments, { __proc: proc.id, ringToken: proc.ringToken })
                                }
                                return c
                            }),
                            "identity": {
                                "username": "akrsmv"
                            }
                        })
                    }
                } else {
                    // used SAM LOCAL env
                    for (const e of this.eventsForAsyncProcessing) {
                        await processPayload({
                            meta: {
                                ringToken: evnt.meta.ringToken as string,
                                eventSource: `worker:${e.eventType === "output" ? e.eventType : "input"}:${e.jobType}`,
                                action: e.action as IItemManagerKeys,
                                item: e.item
                            },
                            payload: {
                                arguments: Object.assign(e.arguments, { __proc: proc.id, ringToken: proc.ringToken }),
                                identity: evnt.payload.identity,
                            }
                        }, undefined)
                        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, "SAM LOCAL FLATTENING ELEMENT FROM PROCEDURE's EVENTS ARRAY", ppjson(evnt))
                    }
                }

                this.eventsForAsyncProcessing = []
            }
        } catch (ex) {
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] (${ex})EXCEPTION in procedure execute method: ${ppjson(ex)}`)
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] proc object when exception happened: ${ppjson(proc)}`)
            procedureResult = proc as DynamoItem & DynamoCommandItem
            procedureResult.errors = ppjson(ex)
            procedureResult.item_state = 'error'
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] procedureResult object when exception happened, after pointing to proc: ${ppjson(procedureResult)}`)
        } finally {
            //#region saving state AFTER procedure ended
            // remove processed_events as it may be already asynchronously modified in db from other events
            delete procedureResult["processed_events"]
            if (!procedureResult.total_events) {
                // if errored and threw exception do not overwrite status
                procedureResult.item_state = procedureResult.item_state || 'success'
            }
            // load latest procedure contents
            // TODO what if async update of procedure sneak in between getting from db and the consequent update? retries?
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] LOADING RPOCEDURE, CALLING: await getItemById(${proc.__typename}, ${proc.id}, ${evnt.meta.ringToken})`)
            const P__from_db = await getItemById(proc.__typename, proc.id, evnt.meta.ringToken)
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] WILL TRY(!)UPDATE PROCEDURE ${ppjson(P__from_db)} WITH sync_end_date after its sync execution has ended`, ppjson(procedureResult))
            if (!!P__from_db) {
                !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] UPDATING PROCEDURE WITH sync_end_date after its sync execution has ended`, ppjson(procedureResult))
                procedureResult = await transactUpdateItem(
                    P__from_db,
                    {
                        sync_end_date: new Date().toISOString(),
                        ...procedureResult,
                        revisions: P__from_db.revisions
                    },
                    (this.lookupItems.get(evnt.meta.item) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys) as DynamoItem & DynamoCommandItem
            }
            //#endregion
            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:START] Procedure ended.`)
            return { result: procedureResult as T }
        }
    }

    //#endregion

    //#region QUERY
    /**
     * implemeneted in client item managers - can add or ammend a query according to business logic
     * @param args 
     * @param identity 
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity, ringToken: string): AsyncGenerator<string, DdbQueryInput, any> {
        return args
    }
    /**
     * T here is DdbQueryInput. TODO improve generics
     * @param args holds gate checkins, transforming incomming args for dynamodb query
     * @param identity 
     */
    async __validateQuery(inputQueryArg: DdbQueryInput, identity: IIdentity, ringToken: string): Promise<DdbQueryInput> {

        if (Array.isArray(inputQueryArg)) throw new Error("payload.arguments must not be an array!")

        if (!inputQueryArg.limit || inputQueryArg.limit > 50) {
            inputQueryArg.limit = 50
        }

        if (!inputQueryArg.pk) {
            throw new Error(`${ringToken}: [__validateQuery] PK is mandatory when querying`)
        }
        // check for proper value on available GSIs
        // TODO!!!
        // if (!!inputQueryArg.ddbIndex && [
        //     "meta__id",
        //     "meta__smetadata",
        //     "smetadata__meta",
        //     "meta__nmetadata",
        //     "nmetadata__meta",].indexOf(inputQueryArg.ddbIndex) < 0) {
        //     throw new Error(`${ringToken}: Provided GSI Name is invalid`)
        // } else 
        if (!!inputQueryArg.ddbIndex) {
            // infer keys from index provided
            inputQueryArg.primaryKeyName = inputQueryArg.ddbIndex.substr(0, inputQueryArg.ddbIndex.indexOf("__"))
            inputQueryArg.rangeKeyName = inputQueryArg.ddbIndex.substr(inputQueryArg.ddbIndex.indexOf("__") + 2)
        } else {
            // assume its about the table
            inputQueryArg.primaryKeyName = "id"
            inputQueryArg.rangeKeyName = "meta"
        }

        if (!process.env.DONT_USE_GRAPHQL_FOR_LOADED_PEERS) {
            !process.env.DEBUGGER || loginfo({ ringToken: ringToken }, "WILL START TRANSFORMING ", ppjson(inputQueryArg))
            Object.assign(inputQueryArg, transformGraphQLSelection(inputQueryArg.selectionSetGraphQL))
            !process.env.DEBUGGER || loginfo({ ringToken: ringToken }, "transformed ", ppjson(inputQueryArg))
        }

        return inputQueryArg
    }

    /**
     * PK
     * RANGE
     * dynamo index name
     * filter
     * limit (page size)
     * pagetoken (page nr)
     * 
     * @param item 
     * @param evnt 
     */
    async *query(evnt: AartsEvent): AsyncGenerator<string, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:QUERY] Begin query method.Received arguments: `, ppjson(evnt))

        const queryParams = await this.__validateQuery(evnt.payload.arguments, evnt.payload.identity, evnt.meta.ringToken)

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, "QUERY IS", ppjson(queryParams))

        const asyncGen = this.validateQuery(queryParams, evnt.payload.identity, evnt.meta.ringToken)
        let processor
        do {
            processor = await asyncGen.next()
            !processor.done && (yield processor.value as string)
        } while (!processor.done)

        const dynamoItems = await queryItems(processor.value as DdbQueryInput);

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:QUERY] End.Result: `, ppjson({ result: dynamoItems }))
        return { result: dynamoItems }
    }
    //#endregion

    //#region DELETE
    /**
     * 
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity 
     */
    async *validateDelete(item: T, identity: IIdentity, ringToken: string): AsyncGenerator<string, T, any> {
        return item
    }
    /**
     * 
     * @param __type gate checks for Delete
     * @param payload 
     */
    async __validateDelete(evnt: AartsEvent): Promise<DdbGetInput> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:__validateDelete] checking for mandatory item keys`)

        if (Array.isArray(evnt.payload.arguments)) throw new Error("payload.arguments must not be an array!")

        for (const arg of evnt.payload.arguments.pks) {
            if (!("id" in arg && "revisions" in arg)) {
                // will throw error if ONLY SOME of the above keys are present
                throw new Error(`${evnt.meta.ringToken}: id and revisions keys is mandatory when deleting`)
            } else {
                arg["meta"] = `${versionString(0)}|${evnt.meta.item}`
                arg["ringToken"] = evnt.meta.ringToken
            }
        }

        return evnt.payload.arguments
    }

    /**
     * making use of dynamodb transactwriteItems. Making update requests
     * @param __type 
     * @param evnt 
     */
    async *delete(evnt: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:DELETE] BEGIN delete method. Doing a gate check of payload`, ppjson(evnt))

        evnt.payload.arguments = await this.__validateDelete(evnt)

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:DELETE] Loading requested items`)

        const dynamoExistingItems = await batchGetItem(evnt.payload.arguments);

        if (dynamoExistingItems.items.length !== evnt.payload.arguments.pks.length) {
            throw new Error(`${evnt.meta.ringToken}: [${evnt.meta.item}:DELETE] Unable to locate all items corresponding to requested id(s)`)
        }

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:DELETE] requested deletion of`, ppjson(dynamoExistingItems))

        for (const existingItem of dynamoExistingItems.items) {
            const requestedId = (evnt.payload.arguments.pks as { id: string, revisions: number }[]).filter(pk => pk.id === existingItem.id)[0]
            if (existingItem.revisions !== requestedId.revisions) {
                throw new Error(`${evnt.meta.ringToken}: [${evnt.meta.item}:DELETE] revisions passed does not match item revisions: ${ppjson(requestedId)}`)
            }
        }

        const deletedItems = []

        for (const arg of evnt.payload.arguments.pks) {
            const existingItem = dynamoExistingItems.items.filter(d => d.id == arg.id && d.meta == arg.meta)[0]

            for await (const domainValidateMessage of this.validateDelete(Object.assign({}, existingItem, arg), evnt.payload.identity, evnt.meta.ringToken)) {
                yield `[${evnt.meta.item}:validateDelete] ${domainValidateMessage}`
            }

            deletedItems.push(
                await transactDeleteItem(
                    existingItem,
                    (this.lookupItems.get(evnt.meta.item) as AnyConstructor<DynamoItem> & DomainItem & { __refkeys: any[] }).__refkeys,
                    evnt.meta.ringToken)
            )
        }

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:DELETE] END. Result: `, ppjson({ result: { items: deletedItems as T[], nextPage: null } }))

        return { result: { items: deletedItems as T[], nextPage: null } }

    }
    //#endregion

    //#region GET
    /**
     * implemented in client item managers
     * @param args 
     * @param identity 
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity, ringToken: string): AsyncGenerator<string, DdbGetInput, any> {
        return args
    }
    /**
     * 
     * @param args holds gate checks, transforming incomming args for dynamodb getItem
     * @param identity 
     */
    async __validateGet(ddbGetInput: DdbGetInput, ringToken: string): Promise<DdbGetInput> {
        !process.env.DEBUGGER || loginfo({ ringToken }, '[__validateGet] Begin. Doing a gate check of payload. Received arguments: ', ppjson(ddbGetInput))

        if (Array.isArray(ddbGetInput)) throw new Error("payload.arguments must not be an array!")
        ddbGetInput.ringToken = ringToken // remember it for logginng from dynamodb client methods
        ddbGetInput.pks = ddbGetInput.pks.reduce<DdbTableItemKey[]>((accum, item) => {
            if (item.id) {
                if (!item.meta) {
                    accum.push({ id: item.id, meta: `${versionString(0)}|${item.id.substr(0, item.id.indexOf("|"))}` })
                } else {
                    accum.push({ id: item.id, meta: item.meta })
                }
            } else {
                throw new Error(`${ringToken}: invalid ID keys passed. id: ${item.id} meta: ${item.meta}`)
            }
            return accum
        }, [])

        // !process.env.DONT_USE_GRAPHQL_FOR_LOADED_PEERS ? transformGraphQLSelection(args[0].selectionSetGraphQL) : {})
        if (!!ddbGetInput.loadPeersLevel || (!!ddbGetInput.peersPropsToLoad && ddbGetInput.peersPropsToLoad.length > 0)) {
            Object.assign(ddbGetInput, transformGraphQLSelection(ddbGetInput.selectionSetGraphQL))
            !process.env.DEBUGGER || loginfo({ ringToken }, '[__validateGet] Transormed loading of peers: ', ppjson(ddbGetInput))
        }

        return ddbGetInput
    }
    /**
     * making use of dynamodb batchGetItems
     * @param item 
     * @param args 
     */
    async *get(evnt: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:GET] Begin get method. Doing a gate check of payload. Received arguments: `, ppjson(evnt))

        evnt.payload.arguments = await this.__validateGet(evnt.payload.arguments, evnt.meta.ringToken)

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, "KEYS TO SEARCH ARE ", ppjson(evnt.payload.arguments))

        const asyncGen = this.validateGet(evnt.payload.arguments, evnt.payload.identity, evnt.meta.ringToken)
        let processor
        do {
            processor = await asyncGen.next()
            !processor.done && (yield processor.value as string)
        } while (!processor.done)

        const dynamoItems = await batchGetItem(processor.value as DdbGetInput);

        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:GET] End. Result: `, ppjson({ result: dynamoItems }))
        return { result: dynamoItems as DBQueryOutput<T> }
    }
    //#endregion

    //#region CREATE
    /**
     * 
     * @param item implemented in client item managers
     * @param identity 
     */
    async *validateCreate(item: T, identity: IIdentity, ringToken: string): AsyncGenerator<string, T, any> {
        return item
    }
    /**
     * 
     * @param __type gate checks for CREATE
     * @param payload 
     */
    async __validateCreate(evnt: AartsEvent): Promise<T> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:__validateCreate] START. checking for mandatory item keys. Received args: `, ppjson(evnt))

        if (Array.isArray(evnt.payload.arguments)) throw new Error("payload.arguments must not be an array!")

        if (!!evnt.payload.arguments.revisions) {
            delete evnt.payload.arguments.revisions
        } else {
            evnt.payload.arguments["meta"] = `${versionString(0)}|${evnt.meta.item}`
            evnt.payload.arguments["__typename"] = evnt.meta.item
            evnt.payload.arguments["ringToken"] = evnt.meta.ringToken
        }

        const proto = this.lookupItems.get(evnt.meta.item)

        if (!proto) {
            throw new Error(`${evnt.meta.ringToken}: [${evnt.meta.item}:CREATE] Not able to locate dynamo item prototype for item ${evnt.meta.item}`)
        }

        return Object.assign(new proto(), evnt.payload.arguments)
    }
    /**
     * making use of dynamodb transactWriteItems, making a put requests for each element from incomming arguments array
     * @param item the item type
     * @param evnt initialization parameters. Each element in the array will result in a separate item created
     */
    async *create(evnt: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:CREATE] Begin create method. Doing a gate check of payload. Received evnt: `, ppjson(evnt))
        try {
            if (evnt.meta.item === "BASE") {
                !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:CREATE] Type is BASE! Directly calling transact put without any checks`, ppjson(evnt))
                const result = await transactPutItem(evnt.payload.arguments, new Map<string, RefKey<any>>())
                return { result }
            }

            const itemToCreate = await this.__validateCreate(evnt)

            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, "itemToCreate: ", ppjson(itemToCreate))

            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}] Calling domain's validateCreate method, evnt: `, ppjson({ itemToCreate }), ppjson({ identity: evnt.payload.identity }), ppjson({ ringToken: evnt.meta.ringToken }))

            const asyncGenDomain = this.validateCreate(itemToCreate, evnt.payload.identity, evnt.meta.ringToken)
            let processorDomain
            do {
                processorDomain = await asyncGenDomain.next()
                !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:validateCreate] output: `, ppjson(processorDomain.value))
                !processorDomain.done && (yield processorDomain.value as string)
            } while (!processorDomain.done)

            const savedItem = await transactPutItem(processorDomain.value as T, (this.lookupItems.get(evnt.meta.item) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
            
            return { result: savedItem as T }
        } catch (err) {
            if (!!evnt.payload.arguments.__proc) {
                await dynamoDbClient.updateItem({
                    TableName: DB_NAME,
                    Key: { id: { S: evnt.payload.arguments.__proc }, meta: { S: `errored|${evnt.meta.sqsMsgId}` } },
                    UpdateExpression: 'SET #ringToken = :ringToken, #proc = :proc, #errors = list_append(if_not_exists(#errors, :empty_list), :err)', // String representation of the update to an attribute
                    ExpressionAttributeNames: {
                        '#errors': 'errors',
                        '#ringToken': 'ringToken',
                        '#proc': '__proc'
                    },
                    ExpressionAttributeValues: { // a map of substitutions for all attribute values
                        ':err': {L:[{S:`${err && err.message ? err.message : ppjson(err).slice(0,500) + '--\n' + `${err && err.stack ? err.stack.slice(0, 500) : ''}`}`}]},
                        ':empty_list': {L:[{S:'empty'}]},
                        ':ringToken': { S: evnt.meta.ringToken },
                        ':proc': { S: evnt.payload.arguments.__proc }
                    },
                    ReturnValues: 'NONE', 
                    ReturnConsumedCapacity: 'NONE', 
                    ReturnItemCollectionMetrics: 'NONE', 
                }).promise()
            }
            throw err
        }
    }
    //#endregion

    //#region UPDATE
    /**
     * 
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity 
     */
    async *validateUpdate(item: T, identity: IIdentity, ringToken: string): AsyncGenerator<string, T, any> {
        return item
    }
    /**
     * 
     * @param __type gate checks for Update
     * @param payload 
     */
    async __validateUpdate(evnt: AartsEvent): Promise<T> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:__validateUpdate] checking for mandatory item keys. Received args: `, ppjson(evnt))

        if (Array.isArray(evnt.payload.arguments)) throw new Error("payload.arguments must not be an array!")

        if (!("id" in evnt.payload.arguments && ("revisions" in evnt.payload.arguments
            // TODO check for item being a procedure not needed? (was because procs are updated only from the libs and do not wanted to throw if not the right revision)
            || evnt.payload.arguments["id"].startsWith("P__")))) {
            // will throw error if ONLY SOME of the above keys are present
            throw new Error(`${evnt.meta.ringToken}: {id, revisions} keys are mandatory when updating`)
        } else {
            evnt.payload.arguments["meta"] = `${versionString(0)}|${evnt.meta.item}`
            evnt.payload.arguments["__typename"] = evnt.meta.item
            evnt.payload.arguments["ringToken"] = evnt.meta.ringToken
        }

        return evnt.payload.arguments
    }

    /**
     * Updates an item in a dynamo transaction
     * @param __type 
     * @param evnt
     */
    async *update(evnt: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:UPDATE] BEGIN update method. Doing a gate check of payload. Received evnt: `, ppjson(evnt))
        try {
            // setting payload.item = "BASE" and payload.action="update" allow you to benefit from distributing update loads accross lambdas
            // while still writing the update request in the client
            if (evnt.meta.item === "BASE") {
                !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:UPDATE] Type is BASE! Directly making transact update without any checks`, ppjson(evnt))
                const result = await dynamoDbClient.transactWriteItems(evnt.payload.arguments).promise()
                return { result: undefined }
            }

            evnt.payload.arguments = await this.__validateUpdate(evnt)

            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:UPDATE] Loading requested items`)
            const dynamoExistingItems = await batchGetItem({ loadPeersLevel: 0, pks: [evnt.payload.arguments], ringToken: evnt.meta.ringToken });
            // console.log("result from batch get", JSON.stringify(dynamoExistingItems))
            if (dynamoExistingItems.items.length !== 1) {
                throw new Error(`${evnt.meta.ringToken}: [${evnt.meta.item}:UPDATE] Unable to locate item corresponding to requested { id: ${evnt.payload.arguments.id}, meta: ${evnt.payload.arguments.meta}}`)
            }

            for await (const domainValidateMessage of this.validateUpdate(Object.assign({}, dynamoExistingItems.items[0], evnt.payload.arguments), evnt.payload.identity, evnt.meta.ringToken)) {
                yield domainValidateMessage as string
            }

            const updatedItem = await transactUpdateItem(
                dynamoExistingItems.items[0],
                evnt.payload.arguments,
                (this.lookupItems.get(evnt.meta.item) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys) as T

            !process.env.DEBUGGER || loginfo({ ringToken: evnt.meta.ringToken }, `[${evnt.meta.item}:UPDATE] END. Result: `, ppjson({ result: updatedItem }))

            // delete any previously errored attempts
            await dynamoDbClient.deleteItem({ TableName: DB_NAME, Key: { id: { S: evnt.payload.arguments.__proc }, meta: { S: `errored|${evnt.meta.sqsMsgId}` } } }).promise()
            return { result: updatedItem }
        } catch (err) {
            if (!!evnt.payload.arguments.__proc) {
                // so this operation is part of a procedure, record an errored event
                // await dynamoDbClient.putItem({
                //     Item: {
                //         id: { S: evnt.payload.arguments.__proc },
                //         __proc: { S: evnt.payload.arguments.__proc },
                //         meta: { S: `errored|${evnt.meta.sqsMsgId}|${evnt.meta.sqsReceiptHandle}` },
                //         err: { S: `${err && err.message ? err.message : err}` },
                //         stack: { S: `${err && err.stack ? err.stack.slice(0, 500) : ''}` },
                //         ringToken: { S: evnt.meta.ringToken }
                //     },
                //     TableName: DB_NAME
                // }).promise()
                await dynamoDbClient.updateItem({
                    TableName: DB_NAME,
                    Key: { id: { S: evnt.payload.arguments.__proc }, meta: { S: `errored|${evnt.meta.sqsMsgId}` } },
                    UpdateExpression: 'SET #ringToken = :ringToken, #proc = :proc, #errors = list_append(if_not_exists(#errors, :empty_list), :err)', // String representation of the update to an attribute
                    ExpressionAttributeNames: {
                        '#errors': 'errors',
                        '#ringToken': 'ringToken',
                        '#proc': '__proc'
                    },
                    ExpressionAttributeValues: { // a map of substitutions for all attribute values
                        ':err': {L:[{S:`${err && err.message ? err.message : ppjson(err).slice(0,500) + '--\n' + `${err && err.stack ? err.stack.slice(0, 500) : ''}`}`}]},
                        ':empty_list': {L:[{S:'empty'}]},
                        ':ringToken': { S: evnt.meta.ringToken },
                        ':proc': { S: evnt.payload.arguments.__proc }
                    },
                    ReturnValues: 'NONE', 
                    ReturnConsumedCapacity: 'NONE', 
                    ReturnItemCollectionMetrics: 'NONE', 
                }).promise()
            }
            throw err
        }
    }
    //#endregion

}