import { versionString } from "./DynamoDbClient";
import { batchGetItem } from "./dynamodb-batchGetItem";
import { transactUpdateItem } from "./dynamodb-transactUpdateItem";
import { transactPutItem } from "./dynamodb-transactPutItem";
import { queryItems } from "./dynamodb-queryItems";
import { transactDeleteItem } from "./dynamodb-transactDeleteItem";
import { AnyConstructor, Mixin, MixinConstructor } from "aarts-types/Mixin"
import { uuid, ppjson } from "aarts-types/utils"
import { AartsEvent, AartsPayload, IIdentity, IItemManager } from "aarts-types/interfaces"
import { DdbQueryInput, RefKey, IBaseDynamoItemProps, IProcedure, DdbTableItemKey, DomainItem } from "./interfaces";


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

            public item_type: string = t
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

    private lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>

    constructor(lookupItems: Map<string, AnyConstructor<DynamoItem & DomainItem>>) {
        this.lookupItems = lookupItems
    }

    //#region START
    /**
     * implemeneted in client item managers - can add or ammend a query according to business logic
     * @param args 
     * @param identity 
     */
    async *validateStart(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined> {
        return item
    }

    async *baseValidateStart(__type: string, payload: AartsPayload): AsyncGenerator<string, AartsPayload, undefined> {
        !process.env.DEBUGGER || (yield `[${__type}:baseValidateStart] START. checking for mandatory item keys: ` + ppjson(payload))

        if (payload.arguments.constructor !== Array) {
            throw new Error(`[${__type}:baseValidateStart] Payload is not an array!`)
        }

        if (payload.arguments.length > 1) {
            throw new Error(`[${__type}:baseValidateStart] excedes the max arguments array length constraint(1)`)
        }

        return payload
    }
    // TODO not implemented yet
    // TODO to initiate the start method of some domain procedure, following some standard contract, with a hirsotry record in dynamo of its execution
    async *start(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {
        // console.log('Received arguments: ', args)
        !process.env.DEBUGGER || (yield { arguments: `[${__type}:START] Begin start method. Doing a gate check of payload`, identity: undefined })

        for await (const baseValidateResult of this.baseValidateStart(__type, args.payload)) {
            yield { arguments: baseValidateResult, identity: undefined }
        }

        const proto = this.lookupItems.get(__type)

        if (!proto) {
            throw new Error(`[${__type}:START] Not able to locate dynamo item prototype for item ${__type}`)
        }

        const dynamoItems = []
        for (const arg of args.payload.arguments) {
            const asyncGenDomain = this.validateStart(
                Object.assign({}, new proto(), arg),
                args.payload.identity)
            let processorDomain = await asyncGenDomain.next()
            do {
                if (!processorDomain.done) {
                    yield { arguments: `[${__type}:validateStart] ${processorDomain.value}`, identity: undefined }
                    processorDomain = await asyncGenDomain.next()
                }
            } while (!processorDomain.done)
            dynamoItems.push(processorDomain.value)

            !process.env.DEBUGGER || (yield { arguments: `[${__type}:START] Procedure applicable for Starting.`, identity: undefined })

            const procedureResult = await (new proto(arg) as unknown as IProcedure<T>).start(__type, args)

            !process.env.DEBUGGER || (yield { arguments: `[${__type}:START] Procedure ended.`, identity: undefined })
            //#region saving state
            //TODO do we want to save state? what exactly are we saving?
            // this is useful if you have a clear distinction between procedure and an item
            // procedures should be started without a specific PK (calling dispatcher, not passing id/meta)
            // which will always result in a new item being recorded - essentially a log of all procedure invocations
            // turning it off for now, as this is not fully tested / designed
            // as to the procedureResult - whatever needs to be saved it should be done inside the start method of the item (i.e in the procedure itself)

            // const asyncGenSave = this.save(__type, Object.assign({}, args, { arguments: [procedureResult] }))
            // let processorSave = await asyncGenSave.next()
            // do {
            //     if (!processorSave.done) {
            //         // !process.env.DEBUGGER || (yield { arguments: Object.assign({}, args, {message: processorSave.value.arguments}), identity: undefined})// do we want more details?
            //         !process.env.DEBUGGER || (yield { arguments: processorSave.value.arguments, identity: undefined })
            //         processorSave = await asyncGenSave.next()
            //     }
            // } while (!processorSave.done)
            //#endregion
        }

        return { arguments: dynamoItems, identity: args.payload.identity }
    }

    //#endregion

    //#region QUERY
    /**
     * implemeneted in client item managers - can add or ammend a query according to business logic
     * @param args 
     * @param identity 
     */
    async *validateQuery(args: DdbQueryInput, identity: IIdentity): AsyncGenerator<string, DdbQueryInput, undefined> {
        return args
    }
    /**
     * T here is DdbQueryInput. TODO improve generics
     * @param args holds gate checkins, transforming incomming args for dynamodb query
     * @param identity 
     */
    async *baseValidateQuery(args: DdbQueryInput[], identity: IIdentity): AsyncGenerator<string, DdbQueryInput, undefined> {

        if (args.constructor !== Array) {
            throw new Error(`[baseValidateQuery] Query args is not an array!`)
        }

        if (args.length > 1) {
            throw new Error(`[baseValidateQuery] Query args array excedes the max arguments array length currently supported(1)`)
        }

        return args.reduce<DdbQueryInput[]>((accum, inputQueryArg) => {
            if (!inputQueryArg.pk) {
                throw new Error(`PK is mandatory when querying`)
            }
            // check for proper value on available GSIs
            if (!!inputQueryArg.ddbIndex && [
                "meta__id",
                "meta__smetadata",
                "smetadata__meta",
                "meta__nmetadata",
                "nmetadata__meta",].indexOf(inputQueryArg.ddbIndex) < 0) {
                throw new Error(`Provided GSI Name is invalid`)
            } else if (!!inputQueryArg.ddbIndex) {
                // infer keys from index provided
                inputQueryArg.primaryKeyName = inputQueryArg.ddbIndex.substr(0, inputQueryArg.ddbIndex.indexOf("__"))
                inputQueryArg.rangeKeyName = inputQueryArg.ddbIndex.substr(inputQueryArg.ddbIndex.indexOf("__") + 2)
            } else {
                // assume its about the table
                inputQueryArg.primaryKeyName = "id"
                inputQueryArg.rangeKeyName = "meta"
            }

            accum.push(inputQueryArg as unknown as DdbQueryInput)
            return accum
        }, [])[0] // TODO query only by one input at a time refactor
    }
    // TODO to return paged results
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
    async *query(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || console.log('query Received arguments: ', JSON.stringify(args, null, 4))
        !process.env.DEBUGGER || (yield { arguments: `[${item}:QUERY] Begin query method. Doing a gate check of payload`, identity: undefined })

        const asyncGenBaseValidate = this.baseValidateQuery(args.payload.arguments, args.payload.identity) // TODO check for id, meta present
        let processorBaseValidate = await asyncGenBaseValidate.next()
        do {
            if (!processorBaseValidate.done) {
                yield { arguments: `[${item}:QUERY] ${processorBaseValidate.value}`, identity: undefined }
                processorBaseValidate = await asyncGenBaseValidate.next()
            }
        } while (!processorBaseValidate.done)

        !process.env.DEBUGGER || console.log("QUERIES ARE " + JSON.stringify(processorBaseValidate.value))

        // this can throw exception due to failed validation, eg. missing id/meta keys
        const asyncGen = this.validateQuery(processorBaseValidate.value, args.payload.identity) // TODO check for id, meta present
        let processor = await asyncGen.next()
        do {
            if (!processor.done) {
                yield { arguments: `[${item}:QUERY] ${processor.value}`, identity: undefined }
                processor = await asyncGen.next()
            }
        } while (!processor.done)

        const dynamoItems = await queryItems(processor.value);

        !process.env.DEBUGGER || (yield { arguments: [`[${item}:QUERY] End`], identity: undefined })
        return { arguments: dynamoItems, identity: args.payload.identity }
    }
    //#endregion

    //#region DELETE
    /**
     * 
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity 
     */
    async *validateDelete(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined> {
        return item
    }
    /**
     * 
     * @param __type gate checks for Update
     * @param payload 
     */
    async *baseValidateDelete(__type: string, event: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || (yield `[${__type}:baseValidateDelete] checking for mandatory item keys`)

        if (event.payload.arguments.constructor !== Array) {
            throw new Error(`[${__type}:baseValidateDelete] Payload is not an array!`)
        }

        if (event.payload.arguments.length > 1) {
            throw new Error(`[${__type}:baseValidateDelete] Payload is array an it excedes the max arguments array length constraint(1)`)
        }

        for (const arg of event.payload.arguments) {
            if (!("id" in arg && "revisions" in arg)) {
                // will throw error if ONLY SOME of the above keys are present
                throw new Error("id and revisions keys is mandatory when deleting")
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
    async *delete(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {
        yield { arguments: `[${__type}:DELETE] BEGIN delete method. Doing a gate check of payload`, identity: undefined }

        for await (const baseValidateResult of this.baseValidateDelete(__type, args)) {
            yield { arguments: baseValidateResult, identity: undefined }
        }

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:DELETE] Loading requested items`, identity: undefined })
        const dynamoExistingItems = await batchGetItem(args.payload.arguments);
        !process.env.DEBUGGER || console.log("result from delete", JSON.stringify(dynamoExistingItems))

        if (dynamoExistingItems.length !== args.payload.arguments.length) {
            throw new Error(`[${__type}:DELETE] Unable to locate items corresponding to requested id(s)`)
        }

        if (dynamoExistingItems[0].revisions !== args.payload.arguments[0].revisions) {
            throw new Error(`[${__type}:DELETE] revisions passed does not match item revisions`)
        }

        const updatedItems = []

        for (const arg of args.payload.arguments) {
            const existingItem = dynamoExistingItems.filter(d => d.id == arg.id && d.meta == arg.meta)[0]

            for await (const domainValidateMessage of this.validateDelete(
                Object.assign({}, existingItem, arg),
                args.payload.identity)) {
                yield { arguments: `[${__type}:validateDelete] ${domainValidateMessage}`, identity: undefined }
            }

            updatedItems.push(
                await transactDeleteItem(
                    existingItem,
                    (this.lookupItems.get(__type) as AnyConstructor<DynamoItem> & DomainItem & { __refkeys: any[] }).__refkeys)
            )
        }

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:DELETE] END`, identity: undefined })

        return { arguments: updatedItems, identity: args.payload.identity }

    }
    //#endregion

    //#region GET
    /**
     * implemented in client item managers
     * @param args 
     * @param identity 
     */
    async *validateGet(args: DdbTableItemKey[], identity: IIdentity): AsyncGenerator<string, DdbTableItemKey[], undefined> {
        return args
    }
    /**
     * 
     * @param args holds get checkins, transforming incomming args for dynamodb getItem
     * @param identity 
     */
    async *baseValidateGet(args: DynamoItem[], identity: IIdentity): AsyncGenerator<string, DdbTableItemKey[], undefined> {
        if (args.constructor !== Array) {
            throw new Error(`[baseValidateGet] Payload is not an array!`)
        }
        return args.reduce<DdbTableItemKey[]>((accum, item) => {
            if (item.id) {
                accum.push({ id: item.id, meta: `${versionString(0)}|${item.id.substr(0, item.id.indexOf("|"))}` })
            } else {
                throw new Error(`invalid ID keys passed. id: ${item.id} meta: ${item.meta}`)
            }
            return accum
        }, [])
    }
    /**
     * making use of dynamodb batchGetItems
     * @param item 
     * @param args 
     */
    async *get(item: string, args: AartsEvent): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || console.log('Received arguments: ', args)
        !process.env.DEBUGGER || (yield { arguments: `[${item}:GET] Begin get method. Doing a gate check of payload`, identity: undefined })

        const asyncGenBaseValidate = this.baseValidateGet(args.payload.arguments, args.payload.identity) // TODO check for id, meta present
        let processorBaseValidate = await asyncGenBaseValidate.next()
        do {
            if (!processorBaseValidate.done) {
                yield { arguments: `[${item}:GET] ${processorBaseValidate.value}`, identity: undefined }
                processorBaseValidate = await asyncGenBaseValidate.next()
            }
        } while (!processorBaseValidate.done)

        !process.env.DEBUGGER || console.log("KEYS TO SEARCH ARE " + JSON.stringify(processorBaseValidate.value))

        // this can throw exception due to failed validation, eg. missing id/meta keys
        const asyncGen = this.validateGet(processorBaseValidate.value, args.payload.identity) // TODO check for id, meta present
        let processor = await asyncGen.next()
        do {
            if (!processor.done) {
                yield { arguments: `[${item}:GET] ${processor.value}`, identity: undefined }
                processor = await asyncGen.next()
            }
        } while (!processor.done)

        const dynamoItems = await batchGetItem(processor.value);

        !process.env.DEBUGGER || (yield { arguments: [`[${item}:GET] End`], identity: undefined })
        return { arguments: dynamoItems, identity: args.payload.identity }
    }
    //#endregion

    //#region CREATE
    /**
     * 
     * @param item implemented in client item managers
     * @param identity 
     */
    async *validateCreate(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined> {
        return item
    }
    /**
     * 
     * @param __type gate checks for CREATE
     * @param payload 
     */
    async *baseValidateCreate(__type: string, event: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || (yield `[${__type}:baseValidateCreate] START. checking for mandatory item keys: ` + ppjson(event))

        if (event.payload.arguments.constructor !== Array) {
            throw new Error(`[${__type}:baseValidateCreate] Payload is not an array!`)
        }

        if (event.payload.arguments.length > 1) {
            throw new Error(`[${__type}:baseValidateCreate] excedes the max arguments array length constraint(1)`)
        }

        for (const arg of event.payload.arguments) {
            if ("id" in arg || "revisions" in arg) {
                // throw new Error(`[${__type}:baseValidateCreate] {id, revisions} should not be present when creating item`)
                delete arg.id; delete arg.revisions
            } else {
                // !process.env.DEBUGGER || console.log("Using supplied ring token for item creation id: ", payload.ringToken)
                // arg["id"] = `${__type}|${payload.ringToken}` NOPE ! dont do that // USE THE RING TOKEN FROM THE EVENT TO ENFORCE IDEMPOTENCY on create events
                arg["meta"] = `${versionString(0)}|${__type}`
                arg["item_type"] = __type
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
    async *create(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {
        // console.log('Received arguments: ', args)
        !process.env.DEBUGGER || (yield { arguments: `[${__type}:CREATE] Begin create method. Doing a gate check of payload`, identity: undefined })

        for await (const baseValidateResult of this.baseValidateCreate(__type, args)) {
            yield { arguments: baseValidateResult, identity: undefined }
        }

        const proto = this.lookupItems.get(__type)

        if (!proto) {
            throw new Error(`[${__type}:CREATE] Not able to locate dynamo item prototype for item ${__type}`)
        }

        const dynamoItems = []
        for (const arg of args.payload.arguments) {

            const itemToCreate = Object.assign({}, new proto(), arg)
            !process.env.DEBUGGER || console.log("itemToCreate: ", ppjson(itemToCreate))

            const asyncGenDomain = this.validateCreate(itemToCreate, args.payload.identity)
            let processorDomain = await asyncGenDomain.next()
            do {
                if (!processorDomain.done) {
                    yield { arguments: `[${__type}:validateCreate] ${processorDomain.value}`, identity: undefined }
                    processorDomain = await asyncGenDomain.next()
                }
            } while (!processorDomain.done)
            dynamoItems.push(processorDomain.value)
        }

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:CREATE] Item applicable for saving. END.`, identity: undefined })

        const asyncGenSave = this.save(__type, Object.assign({}, args.payload, { arguments: dynamoItems }))
        let processorSave = await asyncGenSave.next()
        do {
            if (!processorSave.done) {
                // !process.env.DEBUGGER || (yield { arguments: Object.assign({}, args, {message: processorSave.value.arguments}), identity: undefined})// do we want more details?
                !process.env.DEBUGGER || (yield { arguments: processorSave.value.arguments, identity: undefined })
                processorSave = await asyncGenSave.next()
            }
        } while (!processorSave.done)

        return { arguments: dynamoItems, identity: args.payload.identity }
    }
    //#endregion

    //#region UPDATE
    /**
     * 
     * @param item implemented by client intem managers, if custom domain validation needed
     * @param identity 
     */
    async *validateUpdate(item: T, identity: IIdentity): AsyncGenerator<string, T, undefined> {
        return item
    }
    /**
     * 
     * @param __type gate checks for Update
     * @param payload 
     */
    async *baseValidateUpdate(__type: string, event: AartsEvent): AsyncGenerator<string, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || (yield `[${__type}:baseValidateUpdate] checking for mandatory item keys`)

        if (event.payload.arguments.constructor !== Array) {
            throw new Error(`[${__type}:baseValidateStart] Payload is not an array!`)
        }

        if (event.payload.arguments.length > 1) {
            throw new Error(`[${__type}:baseValidateUpdate] Payload excedes the max arguments array length constraint(1)`)
        }

        for (const arg of event.payload.arguments) {
            if (!("id" in arg && "revisions" in arg)) {
                // will throw error if ONLY SOME of the above keys are present
                throw new Error("{id, revisions} keys are mandatory when updating")
            } else {
                arg["meta"] = `${versionString(0)}|${__type}`
                arg["item_type"] = __type
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
    async *update(__type: string, args: AartsEvent): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {
        !process.env.DEBUGGER || (yield { arguments: `[${__type}:UPDATE] BEGIN update method. Doing a gate check of payload`, identity: undefined })

        for await (const baseValidateResult of this.baseValidateUpdate(__type, args)) {
            yield { arguments: baseValidateResult, identity: undefined }
        }

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:UPDATE] Loading requested items`, identity: undefined })
        const dynamoExistingItems = await batchGetItem(args.payload.arguments);
        // console.log("result from batch get", JSON.stringify(dynamoExistingItems))
        if (dynamoExistingItems.length !== args.payload.arguments.length) {
            throw new Error(`[${__type}:UPDATE] Unable to locate items corresponding to requested id(s)`)
        }

        const updatedItems = []

        for (const arg of args.payload.arguments) {
            const existingItem = dynamoExistingItems.filter(d => d.id == arg.id && d.meta == arg.meta)[0]

            for await (const domainValidateMessage of this.validateUpdate(
                Object.assign({}, existingItem, arg),
                args.payload.identity)) {
                yield { arguments: `[${__type}:validateUpdate] ${domainValidateMessage}`, identity: undefined }
            }

            updatedItems.push(
                await transactUpdateItem(
                    existingItem,
                    arg,
                    (this.lookupItems.get(__type) as unknown as MixinConstructor<typeof DynamoItem>).__refkeys)
                // (this.lookupItems.get(__type) as AnyConstructor<DynamoItem> & DomainItem & { __refkeys: any[] }).__refkeys)
            )
        }

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:UPDATE] END`, identity: undefined })

        return { arguments: updatedItems, identity: args.payload.identity }

    }
    //#endregion

    async *save(__type: string, args: AartsPayload): AsyncGenerator<AartsPayload<T>, AartsPayload<T>, undefined> {

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:SAVE] BEGIN save method. No Gate check of payoad here. This is debatable - purpose of save is to be only internally called or?`, identity: undefined })

        const proto = this.lookupItems.get(__type)

        const item_refkeys = (proto as unknown as MixinConstructor<typeof DynamoItem>).__refkeys
        // console.log("WILL ITERATE OVER THOSE REF KEYS", item_refkeys)
        !process.env.DEBUGGER || (yield { arguments: `[${__type}:SAVE] Analyzing item refkeys, ${ppjson(item_refkeys)}`, identity: undefined })


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
            let response = await transactPutItem(item, item_refkeys)
            !process.env.DEBUGGER || console.log("SAVING TO DYNAMO RESULT: ", response)
        }

        !process.env.DEBUGGER || (yield { arguments: `[${__type}:SAVE] END`, identity: undefined })
        return { arguments: args.arguments, identity: undefined }
    }
}