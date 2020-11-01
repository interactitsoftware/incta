import { AnyConstructor, Mixin } from "aarts-types"
import { uuid, versionString } from "aarts-utils"
import { DomainItem, IBaseDynamoItemProps, RefKey } from "./interfaces"

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
            /**
             * processing errors, could be overwriten in client apps
             */
            strictDomainMode?: boolean
            public processingMessages?: {
                severity: string,
                message: string,
                properties: string
            }[]
        }

        return DynamoItem
    }

export type DynamoItem = Mixin<typeof DynamoItem>