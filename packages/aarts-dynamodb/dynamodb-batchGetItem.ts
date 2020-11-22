'use strict'

import { AttributeMap, BatchGetItemInput, BatchGetItemOutput, BatchGetResponseMap, ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb'
import { dynamoDbClient, toAttributeMapArray, fromAttributeMapArray, DB_NAME, versionString, ddbRequest } from './DynamoDbClient';
import { MixinConstructor } from 'aarts-types/Mixin';
import { DdbGetInput, DdbTableItemKey, RefKey } from './interfaces';
import { loginfo, ppjson } from 'aarts-utils';
import { DynamoItem } from './DynamoItem';
import { DBQueryOutput } from 'aarts-types';

export const batchGetItem = async <T extends DynamoItem>(args: DdbGetInput): Promise<DBQueryOutput<T>> => {
    const keys: AttributeMap[] = toAttributeMapArray(args.pks.map(i => { return { id: i.id, meta: i.meta } }))

    if (args.loadPeersLevel === undefined) {
        args.loadPeersLevel = 0 // default behaviour, do not load peers if not requested
    }

    const params: BatchGetItemInput = {
        RequestItems: {
            [DB_NAME]: {
                Keys: keys,
                // ProjectionExpression: !process.env.DONT_USE_GRAPHQL_FOR_LOADED_PEERS ? args.projectionExpression : undefined
                ProjectionExpression: args.projectionExpression ? args.projectionExpression.split(",").map(key => `#${key}`, []).join(",") : undefined,
                ExpressionAttributeNames: args.projectionExpression ? args.projectionExpression.split(",").reduce<ExpressionAttributeNameMap>((accum, key) => {
                    accum[`#${key}`] = `${key}`
                    return accum
                }, {}) : undefined,
            }
        },
        ReturnConsumedCapacity: 'TOTAL',
    }

    try {
        const dbResult = await ddbRequest(dynamoDbClient.batchGetItem(params), args.ringToken)
        !process.env.DEBUGGER || loginfo({ringToken: args.ringToken}, "====DDB==== BatchGetItemOutput: ", ppjson(dbResult))

        let result = fromAttributeMapArray(((dbResult as BatchGetItemOutput).Responses as BatchGetResponseMap)[DB_NAME] as AttributeMap[]) as DynamoItem[]

        if (args.loadPeersLevel !== 0) {
            for (let resultItem of result) {
                await populateRefKeys(resultItem, args.loadPeersLevel, args.peersPropsToLoad, args.projectionExpression, args.ringToken)
            }
        }

        return {items: result as T[], nextPage: (dbResult as BatchGetItemOutput).UnprocessedKeys }
    } catch (err) {
        throw new Error(ppjson({ request: params, error: err }))
    }

}

export const populateRefKeys = async (resultItem: DynamoItem, loadPeersLevel: number, peersPropsToLoad: string[] | undefined, projectionExpression: string | undefined, ringToken: string) => {
    if (loadPeersLevel === 0) return

    if (!global.domainAdapter && !global.domainAdapter.lookupItems) {
        // skip population of other items if meta info is not present
        return resultItem
    }

    const __type = (resultItem as unknown as DynamoItem).__typename as string
    const __refkeysToItems = (((global.domainAdapter.lookupItems as unknown) as Map<string, MixinConstructor<typeof DynamoItem>>).get(__type)?.__refkeys as RefKey<Record<string, any>>[]).filter(k => !!k.ref && (peersPropsToLoad === undefined || peersPropsToLoad.indexOf(k.key) > -1 || peersPropsToLoad.indexOf(`${k.key[0].toUpperCase()}${k.key.slice(1)}`) > -1))
    const keysToLoad = __refkeysToItems.reduce<{ key: string, pk: { id: string, meta: string } }[]>((accum, i) => {
        if (Object.keys(resultItem).indexOf(i.key) > -1 && !!resultItem[i.key]) {
            accum.push({ key: i.key, pk: { id: resultItem[i.key], meta: `${versionString(0)}|${resultItem[i.key].substr(0, resultItem[i.key].indexOf("|"))}` } })
            return accum
        }
        return accum
    }, [])

    if (keysToLoad.length === 0) return

    const loadedItemsFromKeys = await batchGetItem({
        pks: Array.from(keysToLoad.reduce<Map<string, DdbTableItemKey>>((accum, item) => { accum.set(`${item.pk.id}${item.pk.meta}`, item.pk); return accum }, new Map()).values()),
        loadPeersLevel: --loadPeersLevel,
        peersPropsToLoad,
        projectionExpression,
        ringToken
    })

    for (const refKeyToItem of keysToLoad) {
        resultItem[`${refKeyToItem.key[0].toUpperCase()}${refKeyToItem.key.slice(1)}`] = loadedItemsFromKeys.items.filter(l => l.id === refKeyToItem.pk.id)[0] || resultItem[refKeyToItem.key]
    }
}