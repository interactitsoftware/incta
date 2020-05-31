import { Code, Runtime, Function, LayerVersion } from '@aws-cdk/aws-lambda';
import { FollowMode } from '@aws-cdk/assets';
import { join } from 'path';
import { Duration, RemovalPolicy, App, StackProps, Stack } from '@aws-cdk/core';
import { AttributeType, BillingMode, StreamViewType, ProjectionType, Table } from '@aws-cdk/aws-dynamodb';
import { ENV_VARS__DB_NAME, ENV_VARS__DDB_LOCAL_URL } from '../env-constants';
import { sep } from "path"


export class AartsCoreInfraStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

const clientAppName = __dirname.split(sep).reverse()[2]

const nodeModulesLayer = new LayerVersion(this, 'Libs', {
  code: Code.fromAsset(join("..", clientAppName, "libs-lambda-layer"), {exclude: ["aws-sdk"], follow: FollowMode.ALWAYS}),
  compatibleRuntimes: [Runtime.NODEJS_12_X],
  license: 'Apache-2.0',
  description: 'A layer holding the contracts-compliant domain adapter',

});

const handler = new Function(this, `${clientAppName}Handler`, {
  code: Code.fromAsset(join("..", clientAppName, "dist")),
  handler: `index.handler`,
  runtime: Runtime.NODEJS_12_X,
  timeout: Duration.seconds(30),
  memorySize: 256,
  functionName: `${clientAppName}Handler`,
  retryAttempts: 2,
  layers: [nodeModulesLayer]
})

const table = new Table(this, `${clientAppName}Table`, {
  tableName: clientAppName,
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

  table.grantFullAccess(handler);
  handler.addEnvironment(ENV_VARS__DB_NAME, table.tableName);
  handler.addEnvironment(ENV_VARS__DDB_LOCAL_URL, ``); // used only for local testing
  }
}
