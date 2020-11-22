import { batchGetItem } from "./dynamodb-batchGetItem";
import { queryItems } from "./dynamodb-queryItems";
import { DomainItem } from "./interfaces";
import { versionString } from "./DynamoDbClient"
import { DynamoItem } from "./DynamoItem";

export const getItemsByRefkeyValue = async <T extends DynamoItem>(__type: string, refkeyName: string, refkeyValue: string | number, ringToken: string): Promise<DynamoItem[]> => {
    const prefix = typeof refkeyValue === 'number' ? 'n' : typeof refkeyValue === 'string' ? 's' : undefined
    if (!!refkeyValue && !!prefix) {
        return ((await queryItems({
            ddbIndex: `${prefix}metadata__meta`,
            pk: refkeyValue,
            range: `${__type}}${refkeyName}`,
            primaryKeyName: `${prefix}metadata`,
            rangeKeyName: "meta",
            ringToken
        })).items as T[]);
    } else return [] as T[]
}

export const getItemById = async <T extends DynamoItem>(__type: string, id: string, ringToken: string): Promise<T | null> => {
    if (!!id) {
        const dbResult = await batchGetItem({
            pks: [{ id: id, meta: `${versionString(0)}|${__type}` }],
            ringToken
        })
        if (dbResult.items && dbResult.items.length> 0 && dbResult.items[0]){
            return dbResult.items[0] as T
        }
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
export const setDomainRefkeyFromPayload = async (__type: string, payload: DomainItem, domainRefkey: string, ringToken: string, targetDomainRefkey?: string | undefined, errorsArray?: string[] | undefined): Promise<boolean> => {

    if (!!payload[domainRefkey]) {
        if (!targetDomainRefkey) {
            // support case where both the domain and target domain ref key names are same
            targetDomainRefkey = domainRefkey
        }
        const itemByIdResults = await getItemById(__type, payload[domainRefkey], ringToken)
        if (itemByIdResults !== null) {
            payload[domainRefkey] = itemByIdResults.id
            return true
        } else {
            const itemByTargetRefkeyResults = await getItemsByRefkeyValue(__type, targetDomainRefkey, payload[domainRefkey], ringToken)
            if (itemByTargetRefkeyResults.length === 1) {
                payload[domainRefkey] = itemByTargetRefkeyResults[0].id
                return true
            } else if (itemByTargetRefkeyResults.length > 1) {
                errorsArray && Array.isArray(errorsArray) && errorsArray.push(`[Refkey set] failed, because no target was found by id, and provided value ${payload[domainRefkey]} for ${__type}'s refkey ${targetDomainRefkey} points to multiple items and cannot take decision`)
            } else if (itemByTargetRefkeyResults.length === 0) {
                errorsArray && Array.isArray(errorsArray) && errorsArray.push(`[Refkey set] failed, because no target was found by id, and provided value ${payload[domainRefkey]} for ${__type}'s refkey ${targetDomainRefkey} was not found`)
            }
        }
    }
    payload[domainRefkey] = undefined
    return false
}
