import { batchGetItem } from "./dynamodb-batchGetItem";
import { queryItems } from "./dynamodb-queryItems";
import { DomainItem } from "./interfaces";
import { versionString } from "./DynamoDbClient"
import { DynamoItem } from "./BaseItemManager";

export const getItemsByRefkeyValue = async <T extends DynamoItem>(__type: string, refkeyName: string, refkeyValue: string | number): Promise<DynamoItem[]> => {
    const prefix = typeof refkeyValue === 'number' ? 'n' : typeof refkeyValue === 'string' ? 's' : undefined
    if (!!refkeyValue && !!prefix) {
        return ((await queryItems({
            ddbIndex: `${prefix}metadata__meta`,
            pk: refkeyValue,
            range: `${__type}}${refkeyName}`,
            primaryKeyName: `${prefix}metadata`,
            rangeKeyName: "meta"
        })).items as T[]);
    } else return [] as T[]
}

export const getItemById = async <T extends DynamoItem>(__type: string, id: string): Promise<T[]> => {
    if (!!id) {
        return ((await batchGetItem({
            pks: [{ id: id, meta: `${versionString(0)}|${__type}` }]
        })) as T[]);
    } else return [] as T[]
}

export const getItemsOfType = async <T extends DynamoItem>(__type: string) => {
    if (!!__type) {
        return ((await queryItems({
            ddbIndex: "meta__id",
            pk: `${versionString(0)}|${__type}`,
            primaryKeyName: "meta",
            rangeKeyName: "id"
        })).items as T[]);
    } else return [] as T[]
}

export const setItemRefkeyToPayload = async (__type: string, payload: DomainItem, refkeyName: string, errorsArray: string[]) => {
    //examine payload's country property for assigning it to the organization to be created
    // if no refkeyName prop in payload -> pass successful
    // if refkeyName prop exists try loading by id, 
    // if above fails, try loading by payload[refkeyName], i.e try locating a refkey on the target item,
    // if both attempts fail -> push error to array
    if (!!payload.country) {
        const itemByIdResults = await getItemById(__type, payload[refkeyName])
        if (itemByIdResults.length === 1) {
            payload.item = itemByIdResults[0].id
        } else {
            const itemByNameResults = await getItemsByRefkeyValue(__type, refkeyName, payload[refkeyName])
            if (itemByNameResults.length === 1) {
                payload.item = itemByNameResults[0].id
            } else if (itemByNameResults.length > 1){
                errorsArray.push(`[Refkey set] failed, because provided value ${payload[refkeyName]} for refkey ${refkeyName} points to multiple items and cannot take decision`)
            } else if (itemByNameResults.length === 0) {
                errorsArray.push(`[Refkey set] failed, because provided value ${payload[refkeyName]} for refkey ${refkeyName} was not found`)
            }
        }
    }
}
