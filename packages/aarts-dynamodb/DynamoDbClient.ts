import { DynamoDB, AWSError } from 'aws-sdk'
import { Request } from 'aws-sdk/lib/request'
import { AttributeMap, BatchGetItemOutput, BatchWriteItemOutput, QueryOutput, TransactWriteItemsOutput, UpdateItemOutput } from 'aws-sdk/clients/dynamodb';
import { DynamoItem } from './BaseItemManager';
import { ppjson, versionString } from 'aarts-utils/utils';
import { DdbLoadPeersInput } from './interfaces';

export const offline_options = {
    region: 'ddblocal',
    apiVersion: '2012-08-10',
    signatureVersion: 'v4',
    dynamoDbCrc32: false,
    endpoint: process.env.DDB_LOCAL_URL
}

export const dynamoDbClient: DynamoDB = process.env["AWS_SAM_LOCAL"] ? new DynamoDB(offline_options) : new DynamoDB();

export const DB_NAME = process.env["DB_NAME"] as string

export const dynamoDbConverterOptions: DynamoDB.Converter.ConverterOptions = {
    convertEmptyValues: true
};
export function removeEmpty(obj: Record<string, any>): object {
    return Object.keys(obj)
        .filter(k => obj[k] != null) // Remove undef. and null.
        .reduce(
            (newObj, k) =>
                typeof obj[k] === "object"
                    ? { ...newObj, [k]: removeEmpty(obj[k]) } // Recurse.
                    : { ...newObj, [k]: obj[k] }, // Copy value.
            {}
        )
}
export function leaveKeysOnly<T extends Record<string, any>>(obj: T, keysArray: string[]): T {
    return Object.keys(obj)
        .filter(k => obj[k] != null && keysArray.indexOf(k) > -1) // Remove undef. and null.
        .reduce(
            (newObj, k) =>
                typeof obj[k] === "object"
                    ? { ...newObj, [k]: removeEmpty(leaveKeysOnly(obj[k], keysArray)) } // Recurse.
                    : { ...newObj, [k]: obj[k] }, // Copy value.
            {}
        ) as T
}


/**
 * 
 * @param graphqlQuery TODO switch to using graphql-tag
 * https://stackoverflow.com/questions/49047259/how-to-parse-graphql-request-string-into-an-object
 * Currently complex graphql queries are not optimized
 */
export const transformGraphQLSelection = (graphqlQuery: string | undefined): DdbLoadPeersInput => {
    const result: DdbLoadPeersInput = {
        loadPeersLevel: 0,
        peersPropsToLoad: [],
        projectionExpression: undefined
    }

    if (!graphqlQuery) {
        return result
    }

    const words = graphqlQuery
        .replace(/\.\.\./g, ' ... ')
        .replace(/{/g, ' { ')
        .replace(/}/g, ' } ')
        .replace(/\n|\\n|/g, '')
        .split(/\s+|,/)
        .filter(word => !!word || word.trim() !== '')
    let nesting = 0, prjExp = ['__typename'], loadPeersLevels: number[] = []
    for (let i = 1; i < words.length; i++) { // skip first '{'

        if (words[i] === "{") {
            nesting++
        } else if (words[i] === "...") {
            // skip '...' 'on' 'SomeItem' '{' 'xyz'<-- and position here
            i += 3
            continue
        } else if (words[i] === "}") {
            loadPeersLevels.push(nesting)
            if (nesting >= 1) {
                nesting--
            }
        }
        else {
            if (!words[i].startsWith("_") && `${words[i][0].toUpperCase()}${words[i].slice(1)}` === words[i]) {
                (result.peersPropsToLoad as string[]).push(words[i])
            } else {
                prjExp.push(words[i])
            }
        }
    }
    
    result.peersPropsToLoad = Array.from(new Set(result.peersPropsToLoad))
    result.projectionExpression = Array.from(new Set(prjExp.concat(result.peersPropsToLoad.map(p => `${p[0].toLowerCase()}${p.slice(1)}`)))).join(",")
    result.loadPeersLevel = Math.max(...loadPeersLevels)
    return result
}

export { versionString }
export const deletedVersionString = (nr: number) => `d_${nr}`

export const uniqueitemrefkeyid = <T extends DynamoItem>(item: T, key: string) => `uq|${item.__typename}}${key}`

export const refkeyitemmeta = <T extends DynamoItem>(item: T, key: string) => `${item.__typename}}${key}`
// export const refkeyitemtype = <T extends DynamoItem>(item: DynamoItem, key: string) => `ref_key|${item.__typename}}${key}`
export const refkeyitem = <T extends DynamoItem>(item: T, key: string) => Object.assign(
    {},
    item,
    {
        meta: refkeyitemmeta(item, key),
        smetadata: typeof item[key] === "string" ? item[key] as string : undefined,
        nmetadata: typeof item[key] === "number" ? item[key] as number : undefined,
        // __typename: refkeyitemtype(item, key)
    })

export function ensureOnlyNewKeyUpdates(existingItem: Record<string, any>, itemUpdates: Record<string, any>): object {
    return Object.keys(itemUpdates)
        // Remove those with same value, preserving whatever the revisions passed
        .filter(k => k === "revisions" || (itemUpdates[k] === "__del__" && existingItem[k]) || (itemUpdates[k] !== "__del__" && itemUpdates[k] != existingItem[k]))
        .reduce(
            (newObj, k) =>
                typeof itemUpdates[k] === "object"
                    ? { ...newObj, [k]: ensureOnlyNewKeyUpdates(itemUpdates[k], existingItem[k]) } // Recurse.
                    : { ...newObj, [k]: itemUpdates[k] }, // Copy value.
            {}
        )
}

export const fromAttributeMap = <T>(item: AttributeMap | undefined) => DynamoDB.Converter.unmarshall(
    item || {},
    dynamoDbConverterOptions
) as T

export const toAttributeMap = <T>(item: T) => item && DynamoDB.Converter.marshall(
    removeEmpty(item),
    dynamoDbConverterOptions
)

export const toAttributeMapKeysOnly = <T>(item: T, keysArray: string[]) => item && DynamoDB.Converter.marshall(
    removeEmpty(leaveKeysOnly(item, keysArray)),
    dynamoDbConverterOptions
)

export const toAttributeMapArray = <T>(items: T[]) => items.reduce<DynamoDB.AttributeMap[]>(
    (prev: DynamoDB.AttributeMap[], item: T, index: number, array: T[]) => {
        prev.push(DynamoDB.Converter.marshall(
            removeEmpty(item),
            dynamoDbConverterOptions
        ))
        return prev
    }, [])

export const fromAttributeMapArray = <T>(attrMapArray: DynamoDB.AttributeMap[] | undefined) => (attrMapArray || []).reduce<T[]>(
    (accum: T[], attrMap: AttributeMap) => {
        accum.push(DynamoDB.Converter.unmarshall(
            attrMap,
            dynamoDbConverterOptions
        ) as T)
        return accum
    }, [])

export const ddbRequest = async (
    request: Request<TransactWriteItemsOutput | BatchGetItemOutput | UpdateItemOutput | QueryOutput | BatchWriteItemOutput, AWSError>,
): Promise<TransactWriteItemsOutput | BatchGetItemOutput | QueryOutput | UpdateItemOutput | BatchWriteItemOutput> => {
    let cancellationReasons: { Item: any, Code: string, Message: string }[] = []

    request.on('error', (response, httpResponse) => {
        console.error(`${process.env.ringToken}: Error calling dynamo: ${ppjson(response)}`);
        try {
            cancellationReasons = JSON.parse(httpResponse.httpResponse.body.toString()).CancellationReasons;
            console.log(cancellationReasons, ppjson(cancellationReasons))
        } catch (err) {
            // suppress this just in case some types of errors aren't JSON parseable
            console.error(`${process.env.ringToken}: Error extracting cancellation error`, err);
        }
    });

    // this extractError event ... is it raised at all?
    // request.on('extractError', (response) => {
    //     try {
    //         cancellationReasons = JSON.parse(response.httpResponse.body.toString()).CancellationReasons;
    //     } catch (err) {
    //         // suppress this just in case some types of errors aren't JSON parseable
    //         console.error('Error extracting cancellation error', err);
    //     }
    // });

    try {
        return await request.promise()
    } catch (err) {
        throw new Error(ppjson({
            ringToken: process.env.ringToken,
            cancellationReasons: cancellationReasons && cancellationReasons.length > 1 && cancellationReasons.filter(c => c.Item || c.Message),
            err
        }))
    }
}
