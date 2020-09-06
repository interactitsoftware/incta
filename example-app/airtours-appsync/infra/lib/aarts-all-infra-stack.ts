import { Code, Runtime, Function, LayerVersion } from '@aws-cdk/aws-lambda';
import { FollowMode } from '@aws-cdk/assets';
import { join } from 'path';
import { Duration, RemovalPolicy, App, StackProps, Stack } from '@aws-cdk/core';
import { AttributeType, BillingMode, StreamViewType, ProjectionType, Table } from '@aws-cdk/aws-dynamodb';
import { ENV_VARS__DB_NAME, ENV_VARS__DDB_LOCAL_URL } from '../env-constants';
import { sep } from "path"
import { S3Construct } from './constructs/s3Construct';
import { DynamoDBConstruct } from './constructs/dynamoDbConstruct';
import { CognitoConstruct } from './constructs/cognitoConstruct';
import { EventBusConstruct } from './constructs/eventBusConstruct';
import { AppSyncConstruct } from './constructs/appSyncConstruct';
import { AppSyncLocalDatasourceConstruct } from './constructs/AppSyncLocalDatasourceConstruct';
import { AppSyncLambdaDataSourceConstruct } from './constructs/appSyncLambdaDataSourceConstruct';
import { WorkerConstruct } from './constructs/workerConstruct';


export class AartsAllInfraStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const clientAppName = __dirname.split(sep).reverse()[2]

    const nodeModulesLayer = new LayerVersion(this, clientAppName + 'Modules', {
      code: Code.fromAsset(join("node-modules-layer"), { exclude: [
        "aws-sdk"], follow: FollowMode.ALWAYS }),
      compatibleRuntimes: [Runtime.NODEJS_12_X],
      license: 'Apache-2.0',
      description: 'A layer holding the libraries needed for the contracts-compliant domain adapter',
    });

    const s3Construct = new S3Construct(this, `Buckets`, { clientAppName })

    const dynamoDbConstruct = new DynamoDBConstruct(this, 'DB', { clientAppName })

    const eventBusConstruct = new EventBusConstruct(this, `Events`, {
      clientAppName,
      nodeModulesLayer
    })
    const cognitoConstruct = new CognitoConstruct(this, `Auth`, {clientAppName});
    const appSyncConstruct = new AppSyncConstruct(this, `AppSync`, {
      clientAppName,
      cognitoConstruct: cognitoConstruct
    })

    const appSyncLambdaDatasourceConstruct = new AppSyncLambdaDataSourceConstruct(this, "Mutation", {
      lambdaFunction: eventBusConstruct.eventDispatcher,
      appSyncConstruct: appSyncConstruct,
      mutateResolvers: new Set<string>(['start', 'create', 'update', 'delete']),
      queryResolvers: new Set<string>(['get', 'list'])
    })

    const appSyncLocalDatasourceConstruct = new AppSyncLocalDatasourceConstruct(this, "Local", {
      clientAppName,
      eventBusConstruct: eventBusConstruct,
      appSyncConstruct: appSyncConstruct,
      nodeModulesLayer
    })

    const workerInputHandler = new WorkerConstruct(this, `${clientAppName}Handler`, {
      workerName: `${clientAppName}Handler`,
      functionTimeout: Duration.seconds(10),
      functionHandler: "index.handler",
      functionImplementationPath: join("..", clientAppName, "dist"),
      functionRuntime: Runtime.NODEJS_12_X,
      eventBusConstruct: eventBusConstruct,
      dynamoDbConstruct: dynamoDbConstruct,
      eventSource: "worker:input",
      // envVars: {"DEBUG":"1"}, // avoid inducing aws costs by redundantly printing a lot. If needed add it from aws console
      layers: [
        nodeModulesLayer
      ]
    });
  }
}
