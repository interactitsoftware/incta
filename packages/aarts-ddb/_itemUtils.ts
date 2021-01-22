import { batchGetItem } from "./dynamodb-batchGetItem";
import { queryItems } from "./dynamodb-queryItems";
import { DomainItem, RefKey } from "./interfaces";
import { versionString } from "./DynamoDbClient"
import { DynamoItem } from "./DynamoItem";
import { IDomainAdapter, MixinConstructor } from "aarts-types";
import { loginfo, ppjson } from "aarts-utils";

export const getItemsByRefkeyValue = async <T extends DynamoItem>(__type: string, refkeyName: string, refkeyValue: string | number, ringToken: string): Promise<DynamoItem[]> => {
    if (!!refkeyValue) {
        return ((await queryItems({
            ddbIndex: `${refkeyName}__smetadata`,
            pk: refkeyValue,
            range: __type,
            primaryKeyName: refkeyName,
            rangeKeyName: "smetadata",
            ringToken
        })).items as T[]);
    } else return [] as T[]
}

export const getItemById = async <T extends DynamoItem>(__type: string, ref: string, ringToken: string, allowNoHashInRef?: boolean): Promise<T | null> => {
    if (!!ref && ref.indexOf('#') > 0) {
        const refsplit = ref.split('#')
        if (!allowNoHashInRef && refsplit.length !== 2) {
            throw new Error("getItemById called with a broken ref: " + ref + " for type " + __type)
        }
        const dbResult = await batchGetItem({
            pks: [{ id: refsplit[0], meta: refsplit[1] }],
            ringToken
        })
        if (dbResult.items && dbResult.items.length > 0 && dbResult.items[0]) {
            return dbResult.items[0] as T
        }
    } else if (!allowNoHashInRef && ref.indexOf('#') === -1) {
        throw new Error("getItemById called with a broken ref: " + ref + " for type " + __type)
    }
    return null
}

/**
 * 
 * @param __type 
 * TODO sharding here
 * 
 */
export const getItemsOfType = async <T extends DynamoItem>(__type: string, ringToken: string) => {
    if (!!__type) {
        return ((await queryItems({
            ddbIndex: "meta__id",
            pk: `${versionString(0)}|${__type}`,
            primaryKeyName: "meta",
            rangeKeyName: "id",
            ringToken
        })).items as T[]);
    } else return [] as T[]
}

/**
 * Utily method helping the creation of _whatever_ domain item, which has a refKey property 'domainRefkey', pointing to the id key of another domain item of type __type.
 * 
 *  Examine payload's 'domainRefkey' property for assigning it to the 'Domain''s 'domainRefkey', which would be used for domain item creation
 * - NOTE that this method accepts payload, but the same object is also referred as domain, i.e the same payload is used as DTO for domain item creation
 * - If no domainRefkey prop in payload, do nothing and return _true_
 * - If domainRefkey prop exists try loading by id, if success, set the found id to it and return _true_
 * - If above fails, try loading by payload[domainRefkey], i.e try locating a refkey with this value on the target item, specified by __type,
 * - If both attempts fail -> clean the payload[domainRefkey] and push error to array (if present) and return _false_
 * 
 * @param __type Domain item type, where the _domainRefkey_ points to
 * @param payload input payload object, which is also used for Domain item creation
 * @param domainRefkey property name of the payload, that points to another domain item
 * @param errorsArray optional string array where explanatory error message woould be pushed
 */
export const setDomainRefkeyFromPayload = async (__type: string, payload: DomainItem, domainRefkey: string, targetDomainRefkey: string, ringToken: string, errorsArray?: string[] | undefined): Promise<boolean> => {
    !process.env.DEBUGGER || loginfo({ ringToken }, `entering setDomainRefkeyFromPayload with params`, ppjson({ __type, payload, domainRefkey, ringToken, targetDomainRefkey }))
    !process.env.DEBUGGER || loginfo({ ringToken }, `data model's ref key config is `, ppjson(global.domainAdapter.lookupItems))
    if (!!payload[domainRefkey]) {
        const itemByIdResults = await getItemById(__type, payload[domainRefkey], ringToken, true)
        if (itemByIdResults !== null) {
            payload[domainRefkey] = itemByIdResults.id
            return true
        } else {
            const refKeysConfig = (((global.domainAdapter.lookupItems as unknown) as Map<string, MixinConstructor<typeof DynamoItem>>).get(__type)?.__refkeys as Map<string, RefKey<Record<string, any>>>);
            !process.env.DEBUGGER || loginfo({ ringToken }, `ref keys config for this __type (${__type}) `, ppjson(refKeysConfig))
            const refKeyConfig = refKeysConfig.get(targetDomainRefkey) as RefKey<any>
            !process.env.DEBUGGER || loginfo({ ringToken }, `ref key config for this refkey (${targetDomainRefkey}) `, ppjson(refKeysConfig))
            if (refKeyConfig.unique) {
                const gsiKey = refKeyConfig.gsiKey as string[]
                const itemByTargetRefkeyResults = await getItemsByRefkeyValue(__type, gsiKey[0], payload[domainRefkey], ringToken)
                if (itemByTargetRefkeyResults.length === 1) {
                    payload[domainRefkey] = itemByTargetRefkeyResults[0].id
                    return true
                } else if (itemByTargetRefkeyResults.length > 1) {
                    !process.env.DEBUGGER || loginfo({ ringToken }, `[Refkey set] failed, because no target was found by id, and provided value '${payload[domainRefkey]}' for '${__type}''s refkey '${targetDomainRefkey}'('${gsiKey[0]}') points to multiple items and cannot take decision`)
                    errorsArray && Array.isArray(errorsArray) && errorsArray.push(`[Refkey set] failed, because no target was found by id, and provided value '${payload[domainRefkey]}' for '${__type}''s refkey '${targetDomainRefkey}'('${gsiKey[0]}') points to multiple items and cannot take decision`)
                } else if (itemByTargetRefkeyResults.length === 0) {
                    !process.env.DEBUGGER || loginfo({ ringToken }, `[Refkey set] failed, because no target was found by id, and provided value '${payload[domainRefkey]}' for '${__type}''s refkey '${targetDomainRefkey}'('${gsiKey[0]}') was not found`)
                    errorsArray && Array.isArray(errorsArray) && errorsArray.push(`[Refkey set] failed, because no target was found by id, and provided value '${payload[domainRefkey]}' for '${__type}''s refkey '${targetDomainRefkey}'('${gsiKey[0]}') was not found`)
                }
            }
        }
    }
    payload[domainRefkey] = undefined
    return false
}
