import { DynamoItem } from "../BaseItemManager"
import { dynamoDbClient, DB_NAME, fromAttributeMapArray, versionString, refkeyitemmeta } from "../DynamoDbClient"
import { chunks } from "aarts-utils/utils"
import { WriteRequest } from "aws-sdk/clients/dynamodb"
import { AnyConstructor } from "aarts-types/Mixin"
import { transactPutItem } from "../dynamodb-transactPutItem"
import { RefKey, DomainItem } from "../interfaces"


export const queryForId = async (id: string) => {
    const ddbItemResult = await dynamoDbClient.query(
        {
            TableName: DB_NAME,
            ExpressionAttributeValues: { ":id": { S: id } },
            ExpressionAttributeNames: { "#id": "id" },
            KeyConditionExpression: "#id = :id"
        }).promise();
    return fromAttributeMapArray(ddbItemResult.Items) as (DynamoItem & DomainItem)[]
}

export class Strippable {
    public _obj: DynamoItem & DomainItem
    constructor(obj: DynamoItem & DomainItem) {
        this._obj = obj
    }
    public stripCreatedUpdatedDates = () => stripCreatedUpdatedDates.call(null, this._obj)
    public stripMeta = () => stripMeta.call(null, this._obj)
    public stripSmetadata = () => stripSmetadata.call(null, this._obj)
    public stripNmetadata = () => stripNmetadata.call(null, this._obj)
}

const stripCreatedUpdatedDates = (obj: DynamoItem & DomainItem): Strippable => {
    delete obj.date_created
    delete obj.date_updated
    return new Strippable(obj)
}
const stripMeta = (obj: DynamoItem & DomainItem): Strippable => {
    delete obj.meta
    return new Strippable(obj)
}
const stripSmetadata = (obj: DynamoItem & DomainItem): Strippable => {
    delete obj.smetadata
    return new Strippable(obj)
}
const stripNmetadata = (obj: DynamoItem & DomainItem): Strippable => {
    delete obj.nmetadata
    return new Strippable(obj)
}

export const withSMetadata = (obj: Record<string, any>, key: string) => Object.assign({}, obj, { smetadata: obj[key] })
export const withNMetadata = (obj: Record<string, any>, key: string) => Object.assign({}, obj, { nmetadata: obj[key] })

export const clearDynamo = async () => {
    let scanResult
    do {
        let scanResult = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()
        const items = scanResult.Items && chunks(scanResult.Items, 25)
        if (items) {
            for (const chunk of items) {
                await dynamoDbClient.batchWriteItem({
                    RequestItems: {
                        [DB_NAME]: chunk.reduce<WriteRequest[]>((accum, item) => {
                            accum.push({
                                DeleteRequest: {
                                    Key: { id: { S: item.id.S }, meta: { S: item.meta.S } }
                                }
                            })
                            return accum
                        }, [])
                    }
                }).promise()
            }
        }

        scanResult = await dynamoDbClient.scan({ TableName: DB_NAME }).promise()

    } while (scanResult && scanResult.LastEvaluatedKey)
}

export const getBy_meta__smetadata = (meta: string, smetadata: string) => dynamoDbClient.query(
    {
        TableName: DB_NAME, IndexName: "meta__smetadata",
        KeyConditionExpression: "#meta=:meta and #smetadata = :smetadata",
        ExpressionAttributeValues: { ":meta": { S: meta }, ":smetadata": { S: smetadata } },
        ExpressionAttributeNames: { "#meta": "meta", "#smetadata": "smetadata" }
    })
export const getBy_meta__nmetadata = (meta: string, nmetadata: number) => dynamoDbClient.query(
    {
        TableName: DB_NAME, IndexName: "meta__nmetadata",
        KeyConditionExpression: "#meta=:meta and #nmetadata = :nmetadata",
        ExpressionAttributeValues: { ":meta": { S: meta }, ":nmetadata": { N: `${nmetadata}` } },
        ExpressionAttributeNames: { "#meta": "meta", "#nmetadata": "nmetadata" }
    })
// TODO
export const getBy_smetadata__meta = (meta: string, smetadata: string) => { }
export const getBy_nmetadata__meta = (meta: string, smetadata: string) => { }

// WARNING Do not excerpt more of the below "generic test bodies" like this.
// Its is hard to read
export const testInsertOneNonUniqueRefKey = async<T extends DynamoItem>(
    input: {
        dynamoItemCtor: AnyConstructor<T>,
        propRefKey: string,
        refKeyType: "string" | "number",
        itemRefKeys: RefKey<T>[]
    }) => {
    const item =
        Object.assign(
            new input.dynamoItemCtor(),
            { [input.propRefKey]: input.refKeyType === "string" ? "13" : 13 })

    const result = await transactPutItem(item, input.itemRefKeys)
    expect(result).toBeInstanceOf(input.dynamoItemCtor)

    const createdItems = await queryForId(item.id)
    expect(createdItems.length).toBe(2)

    const ddbMainItem = createdItems.filter(i => i.meta === `${versionString(0)}|${item.__typename}`)[0]
    const ddbRefkeyItemCopy = createdItems.filter(i => i.meta === refkeyitemmeta(item, input.propRefKey))[0]

    expect(ddbMainItem).toEqual(item)

    if (input.refKeyType === "string") {
        return expect(new Strippable(ddbMainItem).stripCreatedUpdatedDates().stripMeta()._obj)
            .toEqual(new Strippable(ddbRefkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripSmetadata()._obj)
    } else {
        return expect(new Strippable(ddbMainItem).stripCreatedUpdatedDates().stripMeta()._obj)
            .toEqual(new Strippable(ddbRefkeyItemCopy).stripCreatedUpdatedDates().stripMeta().stripNmetadata()._obj)
    }

}
