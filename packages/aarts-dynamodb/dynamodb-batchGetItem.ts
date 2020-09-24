'use strict'

import { AttributeMap, BatchGetItemInput, BatchGetItemOutput, BatchGetResponseMap } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, toAttributeMapArray, fromAttributeMapArray, DB_NAME, versionString, ddbRequest } from './DynamoDbClient';
import { DynamoItem } from './BaseItemManager';
import { MixinConstructor } from 'aarts-types/Mixin';
import { DdbGetInput, RefKey } from './interfaces';
import { loginfo, ppjson } from 'aarts-utils/utils';

export const batchGetItem = async <T extends DynamoItem>(args: DdbGetInput): Promise<T[]> => {
    const keys: AttributeMap[] = toAttributeMapArray(args.pks.map(i => { return { id: i.id, meta: i.meta } }))

    if (args.loadPeersLevel === undefined) {
        args.loadPeersLevel = 0 // default behaviour, do not load peers if not requested
    }

    const params: BatchGetItemInput = {
        RequestItems: {
            [DB_NAME]: {
                Keys: keys
            }
        },
        ReturnConsumedCapacity: 'TOTAL',
    }

    const result = await ddbRequest(dynamoDbClient.batchGetItem(params))
    !process.env.DEBUGGER || loginfo("====DDB==== TransactWriteItemsOutput: ", ppjson(result))

    let resultItems = fromAttributeMapArray(((result as BatchGetItemOutput).Responses as BatchGetResponseMap)[DB_NAME] as AttributeMap[]) as DynamoItem[]

    if (args.loadPeersLevel !== 0) {
        for (let resultItem of resultItems) {
            await populateRefKeys(resultItem, args.loadPeersLevel, args.peersPropsToLoad)
        }
    }

    return resultItems as T[]
    
}

export const populateRefKeys = async (resultItem: DynamoItem, loadPeersLevel: number, peersPropsToLoad?: string[] | undefined) => {
    if (loadPeersLevel === 0) return
    
    const __type = (resultItem as unknown as DynamoItem).item_type as string
    const __refkeysToItems = (((global.domainAdapter.lookupItems as unknown) as Map<string, MixinConstructor<typeof DynamoItem>>).get(__type)?.__refkeys as RefKey<Record<string, any>>[]).filter(k => !!k.ref && (peersPropsToLoad === undefined || peersPropsToLoad.indexOf(k.key) > -1))
    const keysToLoad = __refkeysToItems.reduce<{key: string, pk: { id: string, meta: string }}[]>((accum, i) => {
        if (Object.keys(resultItem).indexOf(i.key) > -1 && !!resultItem[i.key]) {
            accum.push({key:i.key, pk: { id: resultItem[i.key], meta: `${versionString(0)}|${resultItem[i.key].substr(0, resultItem[i.key].indexOf("|"))}` }})
            return accum
        }
        return accum
    }, [])
    
    if (keysToLoad.length === 0) return 

    const loadedItemsFromKeys = await batchGetItem({
        pks: keysToLoad.map(k => k.pk),
        loadPeersLevel: --loadPeersLevel,
        peersPropsToLoad
    })

    for (const refKeyToItem of keysToLoad) {
        resultItem[refKeyToItem.key] = loadedItemsFromKeys.filter(l => l.id === refKeyToItem.pk.id)[0] || resultItem[refKeyToItem.key]
    }
}