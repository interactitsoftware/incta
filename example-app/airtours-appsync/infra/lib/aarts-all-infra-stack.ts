import { Code, Runtime, Function, LayerVersion, StartingPosition } from '@aws-cdk/aws-lambda';
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
import { AartsResolver, AppSyncLambdaDataSourceConstruct } from './constructs/appSyncLambdaDataSourceConstruct';
import { WorkerConstruct } from './constructs/workerConstruct';
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';

export const clientAppDirName = __dirname.split(sep).reverse()[2]
export const clientAppName = process.env.CLIENT_APP_NAME || clientAppDirName

export class AartsAllInfraStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const nodeModulesLayer = new LayerVersion(this, clientAppName + 'Modules', {
      code: Code.fromAsset(join("node-modules-layer"), {
        exclude: [
          "aws-sdk"], follow: FollowMode.ALWAYS
      }),
      compatibleRuntimes: [Runtime.NODEJS_12_X],
      license: 'Apache-2.0',
      description: 'A layer holding the libraries needed for the contracts-compliant domain adapter',
    });

    const s3Construct = new S3Construct(this, `Buckets`, {})

    const dynamoDbConstruct = new DynamoDBConstruct(this, 'DB', {})

    const eventBusConstruct = new EventBusConstruct(this, `Events`, {
      nodeModulesLayer,
      dynamoDbConstruct,
    })
    const cognitoConstruct = new CognitoConstruct(this, `Auth`, {});
    const appSyncConstruct = new AppSyncConstruct(this, `AppSync`, {
      cognitoConstruct: cognitoConstruct
    })

    const appSyncLambdaDatasourceConstruct = new AppSyncLambdaDataSourceConstruct(this, "Mutation", {
      lambdaFunction: eventBusConstruct.eventDispatcher,
      appSyncConstruct: appSyncConstruct,
      mutateResolvers: new Set<AartsResolver>([
        { name: 'start', jobType: "long" },
        { name: 'create', jobType: "short" },
        { name: 'update', jobType: "short" },
        { name: 'delete', jobType: "short" },
      ]),
      queryResolvers: new Set<AartsResolver>([
        { name: 'get', jobType: "short" },
        { name: 'query', jobType: "short" }
      ])
    })

    const appSyncLocalDatasourceConstruct = new AppSyncLocalDatasourceConstruct(this, "Local", {
      eventBusConstruct: eventBusConstruct,
      appSyncConstruct: appSyncConstruct,
      nodeModulesLayer
    })

    eventBusConstruct.eventDispatcher.addEventSource(new DynamoEventSource(dynamoDbConstruct.table, 
      { 
        startingPosition: StartingPosition.LATEST,
        batchSize: 10,
        bisectBatchOnError: true,
        parallelizationFactor: 10,
        maxBatchingWindow: Duration.seconds(10)
      }))

    const workerInputHandlerShort = new WorkerConstruct(this, `${clientAppName}HandlerShort`, {
      workerName: `${clientAppName}HandlerShort`,
      functionTimeout: Duration.seconds(10),
      functionHandler: "index.handler",
      functionImplementationPath: join("..", clientAppDirName, "dist"),
      functionRuntime: Runtime.NODEJS_12_X,
      eventBusConstruct: eventBusConstruct,
      dynamoDbConstruct: dynamoDbConstruct,
      eventSource: "worker:input:short",
      // envVars: {"DEBUGGER":"1"}, // avoid inducing aws costs by redundantly printing a lot. If needed add it from aws console
      layers: [
        nodeModulesLayer
      ]
    });

    const workerInputHandlerLong = new WorkerConstruct(this, `${clientAppName}HandlerLong`, {
      workerName: `${clientAppName}HandlerLong`,
      functionTimeout: Duration.minutes(10),
      functionHandler: "index.handler",
      functionImplementationPath: join("..", clientAppDirName, "dist"),
      functionRuntime: Runtime.NODEJS_12_X,
      eventBusConstruct: eventBusConstruct,
      dynamoDbConstruct: dynamoDbConstruct,
      eventSource: "worker:input:long",
      // envVars: {"DEBUGGER":"1"}, // avoid inducing aws costs by redundantly printing a lot. If needed add it from aws console
      layers: [
        nodeModulesLayer
      ]
    });
  }
}
