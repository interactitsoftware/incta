import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import {Function} from '@aws-cdk/aws-lambda'
import { BillingMode, AttributeType, StreamViewType, ProjectionType, CfnTable, Table } from '@aws-cdk/aws-dynamodb';
import { RemovalPolicy } from '@aws-cdk/core';
import { ENV_VARS__DB_NAME, ENV_VARS__TEST_DB_NAME, ENV_VARS__DB_ENDPOINT } from '../../env-constants';

export interface DynamoDBConstructProps {
    clientAppName: string
}
export class DynamoDBConstruct extends cdk.Construct {

    public readonly table: dynamodb.Table;
    public readonly testTable: dynamodb.Table;


    constructor(scope: cdk.Construct, id: string, props: DynamoDBConstructProps) {
        super(scope, id);

        const createTable = (isTestTable?: boolean ) => {
            const table = new Table(this, `${isTestTable ? `TEST${props.clientAppName}`: props.clientAppName}`, {
                tableName: `${isTestTable ? `TEST${props.clientAppName}`: props.clientAppName}`,
                partitionKey: { name: "id", type: AttributeType.STRING },
                sortKey: { name: "meta", type: AttributeType.STRING },
                billingMode: BillingMode.PROVISIONED,
                readCapacity: 10,
                writeCapacity: 10,
                stream: StreamViewType.NEW_AND_OLD_IMAGES,
                removalPolicy: RemovalPolicy.DESTROY // TODO think for prod and later RETAINing of real data
              })
              
              table.addGlobalSecondaryIndex({
                indexName: "meta__smetadata",
                partitionKey: { name: "meta", type: AttributeType.STRING },
                sortKey: { name: "smetadata", type: AttributeType.STRING },
                projectionType: ProjectionType.ALL
              })
              
              table.addGlobalSecondaryIndex({
                indexName: "meta__nmetadata",
                partitionKey: { name: "meta", type: AttributeType.STRING },
                sortKey: { name: "nmetadata", type: AttributeType.NUMBER },
                projectionType: ProjectionType.ALL
              })
              
              table.addGlobalSecondaryIndex({
                indexName: "smetadata__meta",
                partitionKey: { name: "smetadata", type: AttributeType.STRING },
                sortKey: { name: "meta", type: AttributeType.STRING },
                projectionType: ProjectionType.ALL
              })
              
              table.addGlobalSecondaryIndex({
                indexName: "nmetadata__meta",
                partitionKey: { name: "nmetadata", type: AttributeType.NUMBER },
                sortKey: { name: "meta", type: AttributeType.STRING },
                projectionType: ProjectionType.ALL
              })
              
              table.addGlobalSecondaryIndex({
                indexName: "meta__id",
                partitionKey: { name: "meta", type: AttributeType.STRING },
                sortKey: { name: "id", type: AttributeType.STRING },
                projectionType: ProjectionType.ALL
              })

            return table;
        }

        this.table = createTable()
        this.testTable =createTable(true)
    }

    public grantAccess = (func: Function) => {
        this.table.grantFullAccess(func);
        func.addEnvironment(ENV_VARS__DB_NAME, this.table.tableName);
        func.addEnvironment(ENV_VARS__DB_ENDPOINT, `only used when testing locally`);
        
        this.testTable.grantFullAccess(func);
        func.addEnvironment(ENV_VARS__TEST_DB_NAME, this.testTable.tableName);
        func.addEnvironment(ENV_VARS__DB_ENDPOINT, `only used when testing locally`);

    }
}