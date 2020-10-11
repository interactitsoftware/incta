import { DB_NAME, ddbRequest, dynamoDbClient, fromAttributeMap, transformGraphQLSelection, versionString } from "./DynamoDbClient";
import { batchGetItem } from "./dynamodb-batchGetItem";
import { transactUpdateItem } from "./dynamodb-transactUpdateItem";
import { transactPutItem } from "./dynamodb-transactPutItem";
import { queryItems } from "./dynamodb-queryItems";
import { transactDeleteItem } from "./dynamodb-transactDeleteItem";
import { AnyConstructor, Mixin, MixinConstructor } from "aarts-types/Mixin"
import { uuid, ppjson, loginfo } from "aarts-utils/utils"
import { AartsEvent, AartsPayload, IIdentity, IItemManager } from "aarts-types/interfaces"
import { DdbQueryInput, RefKey, IBaseDynamoItemProps, IProcedure, DdbTableItemKey, DomainItem, DdbGetInput } from "./interfaces";
import { StreamRecord } from "aws-lambda";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { getItemById } from "./_itemUtils";

export const DynamoItem =
    <T extends AnyConstructor<DomainItem>>(base: T, t: string, refkeys?: RefKey<InstanceType<T>>[]) => {
        class DynamoItem extends base implements IBaseDynamoItemProps {
            constructor(...input: any[]) {
                super(input)
                Object.assign(this, input.reduce((accum, arg) => {
                    Object.keys(arg).forEach(k => {
                        accum[k] = arg[k]
                    })
                    return accum
                }, {}))
            }

            public static __type: string = t
            public static __refkeys: RefKey<InstanceType<T>>[] = refkeys?.concat([{ key: "ringToken" }]) || [{ key: "ringToken" }]

            public id: string = `${t}|${uuid()}`
            public meta: string = `${versionString(0)}|${t}`
            // SKIP SHARDING IDEA FOR NOW
            // public shardnr: number = 0 // these we do not want spread in GSI's as we do index preloading (only taking them by id)

            // LEAVE (s|n))metadata keys ONLY TO REFKEY LOGIC
            // public smetadata: string = idstr

            public __typename: string = t
            public item_state?: string
            public state_history?: Record<number, string>
            public revisions: number = 0
            public checksum?: string

            public user_created?: string
            public user_updated?: string
            public date_created: string = new Date().toISOString()
            public date_updated: string = new Date().toISOString()
            /**
             * id of last event that modified the record
             */
            public ringToken?: string
        }

        return DynamoItem
    }

export type DynamoItem = Mixin<typeof DynamoItem>

export class BaseDynamoItemManager<T extends DynamoItem> implements IItemManager<T> {

    public lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>

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
                !process.env.DEBUGGER || console.log(`No specific onCreate method was found in manager of ${__type}`)
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
            if (newImage.id.startsWith("Proc__") && (newImage.revisions === 0 || newImage.revisions === 1) && (newImage["processed_events"] as number) >= (newImage["total_events"] as number)) {
                console.log("ISSUING UPDATE-SUCCESS TO PROCEDURE ", ppjson(newImage))
                const Proc__from_db = await getItemById(newImage.__typename, newImage.id)
                if (!!Proc__from_db && !!Proc__from_db[0]) {
                    try { // swallow errors for now
                        await transactUpdateItem(
                            Proc__from_db[0],
                            {
                                end_date: Date.now(),
                                item_state: "success",
                                ringToken: newImage.ringToken,
                                revisions: Proc__from_db[0].revisions,
                                id: newImage.id,
                                meta: newImage.meta,
                            },
                            (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
                    } catch (err) {
                        console.error("ERROR updating Proc__ ", ppjson(err))
                    }
                }
            }

            console.log("CHECKING this.onUpdate ", ppjson(this.onUpdate))
            if (typeof this.onUpdate === "function") {
                await this.onUpdate(__type, newImage)
            } else {
                !process.env.DEBUGGER || console.log(`No specific onUpdate method was found in manager of ${__type}`)
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
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:baseValidateStart] START. checking for mandatory item keys: ` + ppjson(args.payload) }] })
        if (!Array.isArray(args.payload.arguments) || args.payload.arguments.length > 1) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateStart] Payload is not a single element array! ${ppjson(args.payload.arguments)}`)
        }

        // TODO excerpt seting up the procedure object and assigning the ringToken in here, not in the start method as it is now

        args.payload.arguments[0]["ringToken"] = args.meta.ringToken
        return args.payload
    }

    async *start(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload, undefined> {
        // console.log('Received arguments: ', args)
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:START] Begin start method. Doing a gate check of payload` }] })

        const proto = this.lookupItems.get(__type)

        if (!proto) {
            throw new Error(`${process.env.ringToken}: [${__type}:START] Not able to locate dynamo item prototype for item ${__type}`)
        }

        const asyncGenBase = await this.baseValidateStart(__type, args)
        let processorBase = await asyncGenBase.next()
        yield { resultItems: [{ message: `[${__type}:baseValidateStart] ${processorBase.value}` }] }
        do {
            if (!processorBase.done) {
                yield { resultItems: [{ message: `[${__type}:baseValidateStart] ${processorBase.value}` }] }
                processorBase = await asyncGenBase.next()
            }
        } while (!processorBase.done)


        const dynamoItems = []
        for (const arg of processorBase.value.arguments) {
            let procedure = new proto(arg) as unknown as IProcedure<T> & DynamoItem
            procedure.id = `${procedure.__typename}|${procedure.ringToken}` // TODO unify in some more general place. Using the ringToken as the GUID part of a procedure, avoiding one more refkey "procedure"
            const asyncGenDomain = this.validateStart(Object.assign(processorBase.value, { arguments: procedure }))
            let processorDomain = await asyncGenDomain.next()
            yield { resultItems: [{ message: `[${__type}:validateStart] ${processorDomain.value}` }] }
            do {
                if (!processorDomain.done) {
                    yield { resultItems: [{ message: `[${__type}:validateStart] ${processorDomain.value}` }] }
                    processorDomain = await asyncGenDomain.next()
                }
            } while (!processorDomain.done)
            dynamoItems.push(processorDomain.value)

            !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:START] Procedure applicable for Starting.` }] })

            //#region saving state
            // SAVE STATE PRIOR starting - important is to be deterministic on number of events this proc will fire, as this is how we mark it done (comparing processed === total events)
            let asyncGenSave = this.save(__type, Object.assign({}, { identity: args.payload.identity }, { arguments: [procedure] }))
            let processorSave = await asyncGenSave.next()
            !process.env.DEBUGGER || (yield { resultItems: [{ message: processorSave.value.arguments }] })
            do {
                if (!processorSave.done) {
                    // !process.env.DEBUGGER || (yield { arguments: Object.assign({}, args, {message: processorSave.value.arguments}), identity: undefined})// do we want more details?
                    processorSave = await asyncGenSave.next()
                    !process.env.DEBUGGER || (yield { resultItems: [{ message: processorSave.value.arguments }] })
                }
            } while (!processorSave.done)
            //#endregion
            let procedureResult
            try {
                procedureResult = await procedure.start(__type, args)
            } catch (ex) {
                procedure["errors"] = ppjson(ex)
                procedureResult = procedure
            } finally {
                //#region saving state AFTER procedure ended
                if (procedureResult) {
                    delete procedureResult["processed_events"] // important to remove this as it was asynchronously modified from other events
                }
                // if a procedure is not firing any events it must set the success property itself?
                // load latest procedure contents
                // TODO what if async update of procedure sneak in between getting from db and the consequent update? retries?
                const Proc__from_db = await getItemById(procedure.__typename, procedure.id)
                if (!!Proc__from_db && !!Proc__from_db[0]) {
                    await transactUpdateItem(
                        Proc__from_db[0],
                        // procedure,
                        {
                            synchronours_end_date: Date.now(),
                            ...procedureResult,
                            revisions: Proc__from_db[0].revisions
                        },
                        (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
                }
                //#endregion
            }
            !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:START] Procedure ended.` }] })
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
                console.log("WILL START TRANSFORMING " + inputQueryArg)
                Object.assign(inputQueryArg, transformGraphQLSelection(inputQueryArg.selectionSetGraphQL))
                console.log("transformed " + inputQueryArg)
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
        !process.env.DEBUGGER || loginfo('query Received arguments: ', JSON.stringify(args, null, 4))
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:QUERY] Begin query method. Doing a gate check of payload` }] })

        const asyncGenBaseValidate = this.baseValidateQuery(args.payload.arguments, args.payload.identity) // TODO check for id, meta present
        let processorBaseValidate = await asyncGenBaseValidate.next()
        do {
            if (!processorBaseValidate.done) {
                yield { resultItems: [{ message: `[${item}:QUERY] ${processorBaseValidate.value}` }] }
                processorBaseValidate = await asyncGenBaseValidate.next()
            }
        } while (!processorBaseValidate.done)

        !process.env.DEBUGGER || loginfo("QUERIES ARE " + JSON.stringify(processorBaseValidate.value))

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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:QUERY] End` }] })
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
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:baseValidateDelete] checking for mandatory item keys` }] })

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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:DELETE] Loading requested items` }] })
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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:DELETE] END` }] })

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
     * @param args holds get checkins, transforming incomming args for dynamodb getItem
     * @param identity 
     */
    async *baseValidateGet(args: DdbGetInput[], identity: IIdentity): AsyncGenerator<AartsPayload, DdbGetInput, undefined> {

        if (!Array.isArray(args) || args.length > 1) {
            throw new Error(`${process.env.ringToken}: [baseValidateGet] Payload is not a single element array! ${ppjson(args)}`)
        }

        return Object.assign(args[0], {
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
        !process.env.DONT_USE_GRAPHQL_FOR_LOADED_PEERS ? transformGraphQLSelection(args[0].selectionSetGraphQL) : {})
    }
    /**
     * making use of dynamodb batchGetItems
     * @param item 
     * @param args 
     */
    async *get(item: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || loginfo('Received arguments: ', args)
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:GET] Begin get method. Doing a gate check of payload` }] })

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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${item}:GET] End` }] })
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
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:baseValidateCreate] START. checking for mandatory item keys: ` + ppjson(event) }] })

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
    async *create(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {
        // console.log('Received arguments: ', args)
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:CREATE] Begin create method. Doing a gate check of payload` }] })

        for await (const baseValidateResult of this.baseValidateCreate(__type, args)) {
            yield { resultItems: [{ message: baseValidateResult }] }
        }

        const proto = this.lookupItems.get(__type)

        if (!proto) {
            throw new Error(`${process.env.ringToken}: [${__type}:CREATE] Not able to locate dynamo item prototype for item ${__type}`)
        }

        const dynamoItems = []
        for (const arg of args.payload.arguments) {

            !process.env.DEBUGGER || loginfo("Arguments from payload to be merged with itemToCreate: ", arg)
            const itemToCreate = Object.assign({}, new proto(), arg)
            !process.env.DEBUGGER || loginfo("itemToCreate: ", ppjson(itemToCreate))

            const asyncGenDomain = this.validateCreate(itemToCreate, args.payload.identity)
            let processorDomain = await asyncGenDomain.next()
            yield { resultItems: [{ message: `[${__type}:validateCreate] ${ppjson(processorDomain.value)}` }] }
            do {
                if (!processorDomain.done) {
                    processorDomain = await asyncGenDomain.next()
                    yield { resultItems: [{ message: `[${__type}:validateCreate] ${ppjson(processorDomain.value)}` }] }
                }
            } while (!processorDomain.done)
            dynamoItems.push(processorDomain.value)
        }

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:CREATE] Item applicable for saving. END.` }] })

        const asyncGenSave = this.save(__type, Object.assign({}, args.payload, { arguments: dynamoItems }))
        let processorSave = await asyncGenSave.next()
        !process.env.DEBUGGER || (yield { resultItems: [{ message: processorSave.value.arguments }] })
        do {
            if (!processorSave.done) {
                // !process.env.DEBUGGER || (yield { arguments: Object.assign({}, args, {message: processorSave.value.arguments}), identity: undefined})// do we want more details?
                processorSave = await asyncGenSave.next()
                !process.env.DEBUGGER || (yield { resultItems: [{ message: processorSave.value.arguments }] })
            }
        } while (!processorSave.done)

        return { resultItems: dynamoItems, identity: { username: "krasi" } }
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
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:baseValidateUpdate] checking for mandatory item keys` }] })

        if (!Array.isArray(event.payload.arguments) || event.payload.arguments.length > 1) {
            throw new Error(`${process.env.ringToken}: [${__type}:baseValidateUpdate] Payload is not a single element array! ${ppjson(event.payload.arguments)}`)
        }

        for (const arg of event.payload.arguments) {
            if (!("id" in arg && ("revisions" in arg || arg["id"].startsWith("Proc__")))) {
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
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:UPDATE] BEGIN update method. Doing a gate check of payload` }] })

        for await (const baseValidateResult of this.baseValidateUpdate(__type, args)) {
            yield { resultItems: [{ message: baseValidateResult }] }
        }

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:UPDATE] Loading requested items` }] })
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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:UPDATE] END` }] })

        return { resultItems: updatedItems, identity: args.payload.identity }

    }
    //#endregion

    async *save(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload, AartsPayload<T>, undefined> {

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:SAVE] BEGIN save method. No Gate check of payoad here. Saving is only internal. TODO make not visible to clients` }] })

        const proto = this.lookupItems.get(__type)

        const item_refkeys = (proto as unknown as MixinConstructor<typeof DynamoItem>).__refkeys
        // console.log("WILL ITERATE OVER THOSE REF KEYS", item_refkeys)
        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:SAVE] Analyzing item refkeys, ${ppjson(item_refkeys)}` }] })


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

        !process.env.DEBUGGER || (yield { resultItems: [{ message: `[${__type}:SAVE] END` }] })
        return { resultItems: args.arguments }
    }
}