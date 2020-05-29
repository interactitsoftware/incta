import { DynamoDB } from 'aws-sdk'
import { AttributeMap } from 'aws-sdk/clients/dynamodb';

const offline_options = {
    region: 'ddblocal',
    apiVersion: '2012-08-10',
    signatureVersion: 'v4',
    dynamoDbCrc32: false,
    endpoint: process.env["DB_ENDPOINT"]
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

export const versionString = (nr: number) => `v_${nr}`
export const deletedVersionString = (nr: number) => `d_${nr}`

export function ensureOnlyNewKeyUpdates(existingItem: Record<string, any>, itemUpdates: Record<string, any>): object {
    return Object.keys(itemUpdates)
    // Remove those with same value, preserving whatever the revisions passed
        .filter(k => k === "revisions" || (itemUpdates[k] === "__del__" && existingItem[k]) ||  (itemUpdates[k] !== "__del__" && itemUpdates[k] != existingItem[k])) 
        .reduce(
            (newObj, k) =>
                typeof itemUpdates[k] === "object"
                    ? { ...newObj, [k]: ensureOnlyNewKeyUpdates(itemUpdates[k], existingItem[k]) } // Recurse.
                    : { ...newObj, [k]: itemUpdates[k] }, // Copy value.
            {}
        )
}

export const fromAttributeMap = <T>(item: AttributeMap) => DynamoDB.Converter.unmarshall(
    item,
    dynamoDbConverterOptions
) as T

export const toAttributeMap = <T>(item: T) => item && DynamoDB.Converter.marshall(
            removeEmpty(item),
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

export const fromAttributeMapArray = <T>(attrMapArray: DynamoDB.AttributeMap[]) => attrMapArray.reduce<T[]>(
    (accum: T[], attrMap: AttributeMap) => {
        accum.push(DynamoDB.Converter.unmarshall(
            attrMap,
            dynamoDbConverterOptions
        ) as T)
        return accum
    }, [])
