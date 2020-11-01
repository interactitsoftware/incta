import { DB_NAME, ddbRequest, dynamoDbClient, fromAttributeMap, transformGraphQLSelection, versionString } from "aarts-dynamodb";
import { DynamoItem } from "aarts-dynamodb/DynamoItem"
import { batchGetItem } from "aarts-dynamodb";
import { transactUpdateItem } from "aarts-dynamodb";
import { transactPutItem } from "aarts-dynamodb";
import { queryItems } from "aarts-dynamodb";
import { transactDeleteItem } from "aarts-dynamodb";
import { AnyConstructor, Mixin, MixinConstructor } from "aarts-types/Mixin"
import { uuid, ppjson, loginfo, chunks } from "aarts-utils"
import { AartsEvent, AartsPayload, IIdentity, IItemManager, IItemManagerKeys } from "aarts-types/interfaces"
import { DdbQueryInput, RefKey, IBaseDynamoItemProps, IProcedure, DdbTableItemKey, DomainItem, DdbGetInput } from "aarts-dynamodb";
import { StreamRecord } from "aws-lambda";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { getItemById } from "aarts-dynamodb";
import { AppSyncEvent } from "aarts-eb-types"
import { controller } from "aarts-eb-dispatcher"
import { processPayload } from "aarts-eb-handler";

/**
 * NOTE constructor does nothing here
 * Do not instantiate directly, Rather instantiate corresp command item
 */
export class DynamoCommandItem {
    constructor(...args: any[]) { }
    total_events: number = 0
    start_date?: string
    sync_end_date?: string
    async_end_date?: string
    processed_events?: number
    errored_events?: number
    strictDomainMode?: boolean
}

export class BaseDynamoItemManager<T extends DynamoItem> implements IItemManager<T> {

    public lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>
    eventsForAsyncProcessing: AppSyncEvent[] = []

    constructor(lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>) {
        this.lookupItems = lookupItems
    }


    public onCreate: Function | undefined
    public onUpdate: Function | undefined

    //#region STREAMS CALLBACKS
    async _onCreate(__type: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void> {
        if (dynamodbStreamRecord !== undefined) {
            const newImage = fromAttributeMap(dynamodbStreamRecord?.NewImage as AttributeMap) as DynamoItem
            if (!newImage.meta.startsWith(versionString(0))) {
                // break from cycle: dynamodb update -> stream event ->dynamodb update -> etc.. 
                return
            }
            !process.env.DEBUGGER || loginfo("_onCreate CALL BACK FIRED for streamRecord ", newImage)

            if (typeof this.onCreate === "function") {
                !process.env.DEBUGGER || loginfo("CALLING ON CREATE CALL BACK for item ", newImage.__typename)
                await this.onCreate(__type, newImage)
            } else {
                !process.env.DEBUGGER || loginfo(`No specific onCreate method was found in manager of ${__type}`)
            }
        }
    }
    async _onUpdate(__type: string, dynamodbStreamRecord: StreamRecord | undefined): Promise<void> {
        if (dynamodbStreamRecord !== undefined) {
            const newImage = fromAttributeMap(dynamodbStreamRecord?.NewImage as AttributeMap) as DynamoItem
            const oldImage = fromAttributeMap(dynamodbStreamRecord?.OldImage as AttributeMap) as DynamoItem
            !process.env.DEBUGGER || loginfo("_onUpdate CALL BACK FIRED for streamRecord ", newImage)

            // mark procedures as done when total_events=processed_events
            // TODO refine it not to cycle indefinetley
            if (newImage.id.startsWith("P__") && (newImage.revisions === 0 || newImage.revisions === 1) 
            && (newImage["processed_events"] as number) + (newImage["errored_events"] as number) >= (newImage["total_events"] as number)) {
                console.log(`ISSUING UPDATE-${!newImage["errored_events"] || (newImage["errored_events"] as number) === 0 ? 'SUCCESS' : 'ERROR'} TO PROCEDURE`, ppjson(newImage))
                const P__from_db = await getItemById(newImage.__typename, newImage.id)
                if (!!P__from_db && !!P__from_db[0]) {
                    try { // swallow errors for now
                        await transactUpdateItem(
                            P__from_db[0],
                            {
                                end_date: new Date().toISOString(),
                                item_state: `${!newImage["errored_events"] || (newImage["errored_events"] as number) === 0 ? 'success' : 'error'}`,
                                ringToken: newImage.ringToken,
                                revisions: P__from_db[0].revisions,
                                id: newImage.id,
                                meta: newImage.meta,
                            },
                            (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
                    } catch (err) {
                        console.error("ERROR updating P__ ", ppjson(err))
                    }
                }
            }

            console.log("CHECKING this.onUpdate ", ppjson(this.onUpdate))
            if (typeof this.onUpdate === "function") {
                await this.onUpdate(__type, newImage)
            } else {
                !process.env.DEBUGGER || loginfo(`No specific onUpdate method was found in manager of ${__type}`)
            }
        }
    }
    //#endregion

    //#region START
    /**
     * implemeneted in client item managers - can add or ammend a query according to business logic
     * @param args 
     * @param identity 
     */
    async *validateStart(payload: AartsPayload<T>): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        return payload
    }

    async *baseValidateStart(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:baseValidateStart] START. checking for mandatory item keys: `, args.payload)
        if (!Array.isArray(args.payload.arguments) || args.payload.arguments.length > 1) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateStart] Payload is not a single element array! ${ppjson(args.payload.arguments)}`)
        }

        // TODO excerpt seting up the procedure object and assigning the ringToken in here, not in the start method as it is now

        args.payload.arguments[0]["ringToken"] = args.meta.ringToken
        return args.payload
    }

    /**
     * 
     * @param __type Domain Commands overwrite this method to implement command's logic
     * @param args 
     */
    async execute(__type: string, args: AartsEvent): Promise<T & DynamoCommandItem> {
        return args.payload.arguments as T & DynamoCommandItem
    }

    async *start(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:START] Begin start method. Doing a gate check of payload. Received args: `, args)

        const proto = this.lookupItems.get(__type)

        if (!proto) {
            throw new Error(`${process.env.ringToken}: [${__type}:START] Not able to locate dynamo item prototype for item ${__type}`)
        }

        const asyncGenBase = this.baseValidateStart(__type, args)
        let processorBase
        do {
            processorBase = await asyncGenBase.next()
            !process.env.DEBUGGER || loginfo(`[${__type.replace("P__", "")}:baseValidateStart] output: `, processorBase.value)
            !processorBase.done && (yield { resultItems: [{ message: `[${__type.replace("P__", "")}]` }, { output: processorBase.value }] })
        } while (!processorBase.done)


        const dynamoItems = []
        for (const arg of processorBase.value.arguments) {
            let procedure = new proto(arg) as unknown as IProcedure<T> & DynamoItem
            procedure.id = `${procedure.__typename}|${procedure.ringToken}` // TODO unify in some more general place. Using the ringToken as the GUID part of a procedure, avoiding one more refkey "__proc"

            const asyncGenDomain = this.validateStart(Object.assign(processorBase.value, { arguments: procedure }))
            let processorDomain
            do {
                processorDomain = await asyncGenDomain.next()
                !process.env.DEBUGGER || loginfo(`[${__type.replace("P__", "")}:validateStart] output: `, processorDomain.value)
                !processorDomain.done && (yield { resultItems: [{ message: `[${__type.replace("P__", "")}]` }, { output: processorDomain.value }] })
            } while (!processorDomain.done)

            dynamoItems.push(processorDomain.value)

            !process.env.DEBUGGER || loginfo(`[${__type}:START] Procedure applicable for Starting.`)

            //#region saving state
            // SAVE STATE PRIOR starting - important is to be deterministic on number of events this proc will fire, as this is how we mark it done (comparing processed === total events)
            const asyncGenSave = this.save(__type, Object.assign({}, { identity: args.payload.identity }, { arguments: [processorDomain.value.arguments] }))
            let processorSave
            do {
                processorSave = await asyncGenSave.next()
                !process.env.DEBUGGER || loginfo(`[${__type.replace("P__", "")}:save] output: `, processorSave.value)
                !processorSave.done && (yield { resultItems: [{ message: `[${__type.replace("P__", "")}]` }, { output: processorSave.value }] })
            } while (!processorSave.done)
            //#endregion
            let procedureResult
            try {
                const startDate = new Date()
                procedureResult = await this.execute(__type, args)
                procedureResult.total_events = this.eventsForAsyncProcessing.length
                procedureResult.start_date = startDate.toISOString()
                if (this.eventsForAsyncProcessing.length > 0) {
                    if (!process.env["AWS_SAM_LOCAL"]) {
                        // used runtime in aws
                        for (const chunk of chunks(this.eventsForAsyncProcessing, Number(process.env.MAX_PAYLOAD_ARRAY_LENGTH || 25))) {
                            console.log("__proc: " + procedure.id)
                            await controller({
                                //"x" values not necessary here. Can it be deleted or for typescript not complaining to leave it ?
                                "action": "x",
                                "item": "x",
                                "jobType": "long",
                                "ringToken": procedure.ringToken as string,
                                "arguments": chunk.map(c => {
                                    Object.assign(c, { ringToken: procedure.ringToken })
                                    if (Array.isArray(c.arguments)) {
                                        c.arguments.forEach(arg => {
                                            Object.assign(arg, { ringToken: procedure.ringToken })
                                            Object.assign(arg.arguments, { __proc: procedure.id, ringToken: procedure.ringToken })
                                        })
                                    } else {
                                        Object.assign(c.arguments, { __proc: procedure.id, ringToken: procedure.ringToken })
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
                        for (const evnt of this.eventsForAsyncProcessing) {
                            await processPayload({
                                meta: {
                                    ringToken: args.meta.ringToken as string,
                                    eventSource: `worker:${evnt.eventType === "output" ? evnt.eventType : "input"}:${evnt.jobType}`,
                                    action: evnt.action as IItemManagerKeys,
                                    item: evnt.item
                                },
                                payload: {
                                    arguments: Object.assign(evnt.arguments, { __proc: procedure.id, ringToken: procedure.ringToken }),
                                    identity: evnt.identity,
                                }
                            }, undefined)
                            loginfo("SAM LOCAL FLATTENING ELEMENT FROM PROCEDURE's EVENTS ARRAY", evnt)
                        }
                    }

                    this.eventsForAsyncProcessing = []
                }
            } catch (ex) {
                procedure["errors"] = ppjson(ex)
                procedureResult = procedure
            } finally {
                //#region saving state AFTER procedure ended
                if (procedureResult) {
                    delete procedureResult["processed_events"] // important to remove this as it may be already asynchronously modified in db from other events
                    if (!procedureResult.total_events) {
                        procedureResult.item_state = 'success'
                    }
                }
                // load latest procedure contents
                // TODO what if async update of procedure sneak in between getting from db and the consequent update? retries?
                const P__from_db = await getItemById(procedure.__typename, procedure.id)
                console.log("WILL SAVE PRIOR STARTING ", ppjson(procedureResult))
                if (!!P__from_db && !!P__from_db[0]) {
                    await transactUpdateItem(
                        P__from_db[0],
                        // procedure,
                        {
                            sync_end_date: new Date().toISOString(),
                            ...procedureResult,
                            revisions: P__from_db[0].revisions
                        },
                        (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
                }
                //#endregion
            }
            !process.env.DEBUGGER || loginfo(`[${__type}:START] Procedure ended.`)
        }

        return { resultItems: dynamoItems, identity: args.payload.identity }
    }

    //#endregion

    //#region QUERY
    /**
     * implemeneted in client item managers - can add or ammend a query according to business logic
     * @param args 
     * @param identity 
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbQueryInput, undefined> {
        return args
    }
    /**
     * T here is DdbQueryInput. TODO improve generics
     * @param args holds gate checkins, transforming incomming args for dynamodb query
     * @param identity 
     */
    async *baseValidateQuery(args: DdbQueryInput[], identity: IIdentity): AsyncGenerator<AartsPayload, DdbQueryInput, undefined> {

        if (!Array.isArray(args) || args.length > 1) {
            throw new Error(`${process.env.ringToken}: [baseValidateQuery] Payload is not a single element array! ${ppjson(args)}`)
        }

        if (!args[0].limit || args[0].limit > 50) {
            args[0].limit = 50
        }

        return args.reduce<DdbQueryInput[]>((accum, inputQueryArg) => {
            if (!inputQueryArg.pk) {
                throw new Error(`${process.env.ringToken}: [baseValidateQuery] PK is mandatory when querying`)
            }
            // check for proper value on available GSIs
            if (!!inputQueryArg.ddbIndex && [
                "meta__id",
                "meta__smetadata",
                "smetadata__meta",
                "meta__nmetadata",
                "nmetadata__meta",].indexOf(inputQueryArg.ddbIndex) < 0) {
                throw new Error(`${process.env.ringToken}: Provided GSI Name is invalid`)
            } else if (!!inputQueryArg.ddbIndex) {
                // infer keys from index provided
                inputQueryArg.primaryKeyName = inputQueryArg.ddbIndex.substr(0, inputQueryArg.ddbIndex.indexOf("__"))
                inputQueryArg.rangeKeyName = inputQueryArg.ddbIndex.substr(inputQueryArg.ddbIndex.indexOf("__") + 2)
            } else {
                // assume its about the table
                inputQueryArg.primaryKeyName = "id"
                inputQueryArg.rangeKeyName = "meta"
            }

            if (!process.env.DONT_USE_GRAPHQL_FOR_LOADED_PEERS) {
                console.log("WILL START TRANSFORMING ", inputQueryArg)
                Object.assign(inputQueryArg, transformGraphQLSelection(inputQueryArg.selectionSetGraphQL))
                console.log("transformed ", inputQueryArg)
            }

            accum.push(inputQueryArg as unknown as DdbQueryInput)
            return accum
        }, [])[0] // TODO query only by one input at a time refactor
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
     * @param args 
     */
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo(`[${item}:QUERY] Begin query method.Received arguments: `, args)

        const asyncGenBaseValidate = this.baseValidateQuery(args.payload.arguments, args.payload.identity) // TODO check for id, meta present
        let processorBaseValidate = await asyncGenBaseValidate.next()
        do {
            if (!processorBaseValidate.done) {
                yield { resultItems: [{ message: `[${item}:QUERY] ${processorBaseValidate.value}` }] }
                processorBaseValidate = await asyncGenBaseValidate.next()
            }
        } while (!processorBaseValidate.done)

        !process.env.DEBUGGER || loginfo("QUERIES ARE ", processorBaseValidate.value)

        // this can throw exception due to failed validation, eg. missing id/meta keys
        const asyncGen = this.validateQuery(processorBaseValidate.value, args.payload.identity) // TODO check for id, meta present
        let processor = await asyncGen.next()
        do {
            if (!processor.done) {
                yield { resultItems: [{ message: `[${item}:QUERY] ${processor.value}` }] }
                processor = await asyncGen.next()
            }
        } while (!processor.done)

        const dynamoItems = await queryItems(processor.value);

        !process.env.DEBUGGER || loginfo(`[${item}:QUERY] End.Result: `, { resultItems: [dynamoItems] })
        return { resultItems: [dynamoItems] }
    }
    //#endregion

    //#region DELETE
    /**
     * 
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity 
     */
    async *validateDelete(item: T, identity: IIdentity): AsyncGenerator<AartsPayload, T, undefined> {
        return item
    }
    /**
     * 
     * @param __type gate checks for Update
     * @param payload 
     */
    async *baseValidateDelete(__type: string, event: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:baseValidateDelete] checking for mandatory item keys`)

        if (!Array.isArray(event.payload.arguments) || event.payload.arguments.length > 1) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateDelete] Payload is not a single element array! ${ppjson(event.payload.arguments)}`)
        }

        for (const arg of event.payload.arguments[0].pks) {
            if (!("id" in arg && "revisions" in arg)) {
                // will throw error if ONLY SOME of the above keys are present
                throw new Error(`${process.env.ringToken}: id and revisions keys is mandatory when deleting`)
            } else {
                arg["meta"] = `${versionString(0)}|${__type}`
                arg["ringToken"] = event.meta.ringToken
            }
        }

        return event.payload
    }

    /**
     * making use of dynamodb transactwriteItems. Making update requests
     * @param __type 
     * @param args 
     */
    async *delete(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        yield { resultItems: [{ message: `[${__type}:DELETE] BEGIN delete method. Doing a gate check of payload` }] }

        for await (const baseValidateResult of this.baseValidateDelete(__type, args)) {
            yield { resultItems: [{ message: baseValidateResult }] }
        }

        !process.env.DEBUGGER || loginfo(`[${__type}:DELETE] Loading requested items`)
        const dynamoExistingItems = await batchGetItem(args.payload.arguments[0]);

        if (dynamoExistingItems.length !== args.payload.arguments[0].pks.length) {
            throw new Error(`${process.env.ringToken}: [${__type}:DELETE] Unable to locate items corresponding to requested id(s)`)
        }

        yield { resultItems: [{ message: `[${__type}:DELETE] requested deletion of ${ppjson(dynamoExistingItems)}` }] }


        for (const existingItem of dynamoExistingItems) {
            const requestedId = (args.payload.arguments[0].pks as { id: string, revisions: number }[]).filter(pk => pk.id === existingItem.id)[0]
            if (existingItem.revisions !== requestedId.revisions) {
                throw new Error(`${process.env.ringToken}: [${__type}:DELETE] revisions passed does not match item revisions: ${ppjson(requestedId)}`)
            }
        }


        const updatedItems = []

        for (const arg of args.payload.arguments[0].pks) {
            const existingItem = dynamoExistingItems.filter(d => d.id == arg.id && d.meta == arg.meta)[0]

            for await (const domainValidateMessage of this.validateDelete(
                Object.assign({}, existingItem, arg),
                args.payload.identity)) {
                yield { resultItems: [{ message: `[${__type}:validateDelete] ${domainValidateMessage}` }] }
            }

            updatedItems.push(
                await transactDeleteItem(
                    existingItem,
                    (this.lookupItems.get(__type) as AnyConstructor<DynamoItem> & DomainItem & { __refkeys: any[] }).__refkeys)
            )
        }

        !process.env.DEBUGGER || loginfo(`[${__type}:DELETE] END. Result: `, { arguments: updatedItems, identity: args.payload.identity })

        return { arguments: updatedItems, identity: args.payload.identity }

    }
    //#endregion

    //#region GET
    /**
     * implemented in client item managers
     * @param args 
     * @param identity 
     */
    async *validateGet(args: DdbGetInput, identity: IIdentity): AsyncGenerator<AartsPayload, DdbGetInput, undefined> {
        return args
    }
    /**
     * 
     * @param args holds gate checks, transforming incomming args for dynamodb getItem
     * @param identity 
     */
    async *baseValidateGet(args: DdbGetInput[], identity: IIdentity): AsyncGenerator<AartsPayload, DdbGetInput, undefined> {

        if (!Array.isArray(args) || args.length > 1) {
            throw new Error(`${process.env.ringToken}: [baseValidateGet] Payload is not a single element array! ${ppjson(args)}`)
        }

        const getInput = Object.assign({}, args[0], {
            pks: args[0].pks.reduce<DdbTableItemKey[]>((accum, item) => {
                if (item.id) {
                    if (!item.meta) {
                        accum.push({ id: item.id, meta: `${versionString(0)}|${item.id.substr(0, item.id.indexOf("|"))}` })
                    } else {
                        accum.push({ id: item.id, meta: item.meta })
                    }
                } else {
                    throw new Error(`${process.env.ringToken}: invalid ID keys passed. id: ${item.id} meta: ${item.meta}`)
                }
                return accum
            }, [])
        },
            // !process.env.DONT_USE_GRAPHQL_FOR_LOADED_PEERS ? transformGraphQLSelection(args[0].selectionSetGraphQL) : {})
            !!args[0].loadPeersLevel || (!!args[0].peersPropsToLoad && args[0].peersPropsToLoad.length > 0) ? transformGraphQLSelection(args[0].selectionSetGraphQL) : {})
        console.log("transformed ", getInput)
        return getInput

    }
    /**
     * making use of dynamodb batchGetItems
     * @param item 
     * @param args 
     */
    async *get(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo(`[${item}:GET] Begin get method. Doing a gate check of payload. Received arguments: `, args)

        const asyncGenBaseValidate = this.baseValidateGet(args.payload.arguments, args.payload.identity) // TODO check for id, meta present
        let processorBaseValidate = await asyncGenBaseValidate.next()
        do {
            if (!processorBaseValidate.done) {
                yield { resultItems: [{ message: `[${item}:GET] ${processorBaseValidate.value}` }] }
                processorBaseValidate = await asyncGenBaseValidate.next()
            }
        } while (!processorBaseValidate.done)

        !process.env.DEBUGGER || loginfo("KEYS TO SEARCH ARE " + JSON.stringify(processorBaseValidate.value))

        // this can throw exception due to failed validation, eg. missing id/meta keys
        const asyncGen = this.validateGet(processorBaseValidate.value, args.payload.identity) // TODO check for id, meta present
        let processor = await asyncGen.next()
        do {
            if (!processor.done) {
                yield { resultItems: [{ message: `[${item}:GET] ${processor.value}` }] }
                processor = await asyncGen.next()
            }
        } while (!processor.done)

        const dynamoItems = await batchGetItem(processor.value);

        !process.env.DEBUGGER || loginfo(`[${item}:GET] End. Result: `, { arguments: dynamoItems, identity: args.payload.identity })
        return { arguments: dynamoItems, identity: args.payload.identity }
    }
    //#endregion

    //#region CREATE
    /**
     * 
     * @param item implemented in client item managers
     * @param identity 
     */
    async *validateCreate(item: T, identity: IIdentity): AsyncGenerator<AartsPayload, T, undefined> {
        return item
    }
    /**
     * 
     * @param __type gate checks for CREATE
     * @param payload 
     */
    async *baseValidateCreate(__type: string, event: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:baseValidateCreate] START. checking for mandatory item keys. Received args: `, event)

        if (!Array.isArray(event.payload.arguments) || event.payload.arguments.length > 1) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateCreate] Payload is not a single element array! ${ppjson(event.payload.arguments)}`)
        }

        if (!event.payload.arguments[0]) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateCreate] Payload is a single element array, but its invalid ! ${ppjson(event.payload.arguments)}`);
        }


        for (const arg of event.payload.arguments) {
            if ("revisions" in arg) {
                // throw new Error(`${process.env.ringToken}: [${__type}:baseValidateCreate] {id, revisions} should not be present when creating item`)
                delete arg.revisions
            } else {
                // !process.env.DEBUGGER || loginfo("Using supplied ring token for item creation id: ", payload.ringToken)
                // arg["id"] = `${__type}|${payload.ringToken}` NOPE ! dont do that, allow clients to cpecify their own ID, ex usage see nomenclatures
                arg["meta"] = `${versionString(0)}|${__type}`
                arg["__typename"] = __type
                arg["ringToken"] = event.meta.ringToken
            }
        }

        return event.payload as AartsPayload<T>
    }
    /**
     * making use of dynamodb transactWriteItems, making a put requests for each element from incomming arguments array
     * @param item the item type
     * @param args initialization parameters. Each element in the array will result in a separate item created
     */
    async *create(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:CREATE] Begin create method. Doing a gate check of payload. Received args: `, args)

        // for await (const baseValidateResult of this.baseValidateCreate(__type, args)) {
        //     !process.env.DEBUGGER || loginfo(`[${__type}:baseValidateCreate] output: `, baseValidateResult)
        //     yield { resultItems: [{ message: `[${__type.replace("P__", "")}:]` }, { output: baseValidateResult }] }
        // }
        try {
            const asyncGenBase = this.baseValidateCreate(__type, args)
            let processorBase
            do {
                processorBase = await asyncGenBase.next()
                !process.env.DEBUGGER || loginfo(`[${__type}:baseValidateCreate] output: `, processorBase.value)
                !processorBase.done && (yield { resultItems: [{ message: `[${__type.replace("P__", "")}:]` }, { output: processorBase.value }] })
            } while (!processorBase.done)

            const proto = this.lookupItems.get(__type)

            if (!proto) {
                throw new Error(`${process.env.ringToken}: [${__type}:CREATE] Not able to locate dynamo item prototype for item ${__type}`)
            }

            const dynamoItems = []
            for (const arg of args.payload.arguments) {

                !process.env.DEBUGGER || loginfo("Arguments from payload to be merged with itemToCreate: ", arg)
                const itemToCreate = Object.assign({}, new proto(), arg)
                !process.env.DEBUGGER || loginfo("itemToCreate: ", itemToCreate)

                !process.env.DEBUGGER || loginfo(`[${__type}] Calling domain's validateCreate method, Args: `, { itemToCreate }, { identity: args.payload.identity })

                const asyncGenDomain = this.validateCreate(itemToCreate, args.payload.identity)
                let processorDomain
                do {
                    processorDomain = await asyncGenDomain.next()
                    !process.env.DEBUGGER || loginfo(`[${__type}:validateCreate] output: `, processorDomain.value)
                    !processorDomain.done && (yield { resultItems: [{ message: `[${__type.replace("P__", "")}:]` }, { output: processorDomain.value }] })
                } while (!processorDomain.done)

                dynamoItems.push(processorDomain.value)
            }

            !process.env.DEBUGGER || loginfo(`[${__type}:CREATE] Item applicable for saving.`)


            const asyncGenSave = this.save(__type, Object.assign({}, args.payload, { arguments: dynamoItems }))
            let processorSave = await asyncGenSave.next()
            !process.env.DEBUGGER || loginfo(`[${__type}:CREATE] Saving item result: `, processorSave.value.arguments)
            do {
                if (!processorSave.done) {
                    processorSave = await asyncGenSave.next()
                    !process.env.DEBUGGER || loginfo(`[${__type}:CREATE] Saving item result: `, processorSave.value.arguments)
                }
            } while (!processorSave.done)
            return { resultItems: dynamoItems, identity: args.payload.identity }
        } catch (err) {
            if (!!args.payload.arguments[0].__proc) {
                // so this operation is part of a procedure, record an errored event
                await dynamoDbClient.putItem({
                    Item: {
                        id: { S: args.payload.arguments[0].__proc },
                        __proc: {S: args.payload.arguments[0].__proc},
                        meta: { S: `errored|${args.meta.sqsMsgId || args.meta.ringToken}` },
                        err: { S: `${err && err.message ? err.message : err}` },
                        stack: { S: `${err && err.stack ? err.stack.slice(0,500) : ''}` },
                        ringToken: {S: args.meta.ringToken}
                    },
                    TableName: DB_NAME
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
    async *validateUpdate(item: T, identity: IIdentity): AsyncGenerator<AartsPayload, T, undefined> {
        return item
    }
    /**
     * 
     * @param __type gate checks for Update
     * @param payload 
     */
    async *baseValidateUpdate(__type: string, event: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:baseValidateUpdate] checking for mandatory item keys. Received args: `, event)

        if (!Array.isArray(event.payload.arguments) || event.payload.arguments.length > 1) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateUpdate] Payload is not a single element array! ${ppjson(event.payload.arguments)}`)
        }

        for (const arg of event.payload.arguments) {
            if (!("id" in arg && ("revisions" in arg || arg["id"].startsWith("P__")))) {
                // will throw error if ONLY SOME of the above keys are present
                throw new Error(`${process.env.ringToken}: {id, revisions} keys are mandatory when updating`)
            } else {
                arg["meta"] = `${versionString(0)}|${__type}`
                arg["__typename"] = __type
                arg["ringToken"] = event.meta.ringToken
            }
        }

        return event.payload as AartsPayload<T>
    }

    /**
     * making use of dynamodb transactwriteItems. Making update requests
     * @param __type 
     * @param args
     */
    async *update(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:UPDATE] BEGIN update method. Doing a gate check of payload. Received Args: `, args)

        for await (const baseValidateResult of this.baseValidateUpdate(__type, args)) {
            yield { resultItems: [{ message: baseValidateResult }] }
        }

        !process.env.DEBUGGER || loginfo(`[${__type}:UPDATE] Loading requested items`)
        const dynamoExistingItems = await batchGetItem({ loadPeersLevel: 0, pks: args.payload.arguments });
        // console.log("result from batch get", JSON.stringify(dynamoExistingItems))
        if (dynamoExistingItems.length !== args.payload.arguments.length) {
            throw new Error(`${process.env.ringToken}: [${__type}:UPDATE] Unable to locate items corresponding to requested id(s)`)
        }

        const updatedItems = []

        for (const arg of args.payload.arguments) {
            const existingItem = dynamoExistingItems.filter(d => d.id == arg.id && d.meta == arg.meta)[0]

            for await (const domainValidateMessage of this.validateUpdate(
                Object.assign({}, existingItem, arg),
                args.payload.identity)) {
                yield { resultItems: [{ message: `[${__type}:validateUpdate] ${domainValidateMessage}` }] }
            }

            updatedItems.push(
                await transactUpdateItem(
                    existingItem,
                    arg,
                    (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
            )
        }

        !process.env.DEBUGGER || loginfo(`[${__type}:UPDATE] END. Result: `, { resultItems: updatedItems, identity: args.payload.identity })

        return { resultItems: updatedItems, identity: args.payload.identity }

    }
    //#endregion

    async *save(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo(`[${__type}:SAVE] BEGIN save method. No Gate check of payoad here. Saving is only internal. TODO make not visible to clients`)

        const proto = this.lookupItems.get(__type)

        const item_refkeys = (proto as unknown as MixinConstructor<typeof DynamoItem>).__refkeys
        !process.env.DEBUGGER || loginfo(`[${__type}:SAVE] Analyzing item refkeys: `, item_refkeys)


        // USING BATCH WRITEITEM WITHOUT TRANSACTION, TODO leave a method for non transactional save of bulk data? +Can again define it on IItemManager level?
        // const item_refs: T[] = []
        // for (const item of args.arguments) {
        //     // analyse each item and create new DynamoItems for each item's ref
        //     for (const refkey of item_refkeys) {
        //         //@ts-ignore
        //         if (!!item[refkey]) {
        //             item_refs.push(
        //                 removeEmpty(new class Ref extends ItemReference(item, refkey) { }) as unknown as T
        //             )
        //         }
        //     }
        // }
        // const item_and_its_refs = args.arguments.concat(item_refs)
        // const chunked = chunks(item_and_its_refs, 25)
        // for (const chunk of chunked) {
        //     let response = await batchPutItems(chunk) // - using batchPutItem
        //     // console.log("SAVING TO DYNAMO RESULT: ", response)
        // }

        // USING WRITING IN A TRANSACTION
        for (const item of args.arguments) {
            if (!!item) {
                let response = await transactPutItem(item, item_refkeys)
                !process.env.DEBUGGER || loginfo("SAVING TO DYNAMO RESULT: ", response)
            }
        }

        // !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:SAVE] END` }] })
        !process.env.DEBUGGER || loginfo(`[${__type}:SAVE] END. Result [TODO shouldnt we send the actual result of saving instead of returing input args, as it is now?] `, { resultItems: args.arguments })
        return { resultItems: args.arguments }
    }
}