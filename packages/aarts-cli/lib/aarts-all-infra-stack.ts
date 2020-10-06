import { Code, Runtime, LayerVersion, StartingPosition } from '@aws-cdk/aws-lambda';
import { FollowMode } from '@aws-cdk/assets';
import { join } from 'path';
import { Duration, App, StackProps, Stack, CfnOutput } from '@aws-cdk/core';
import { DynamoDBConstruct } from './constructs/dynamoDbConstruct';
import { CognitoConstruct } from './constructs/cognitoConstruct';
import { EventBusConstruct } from './constructs/eventBusConstruct';
import { AppSyncConstruct } from './constructs/appSyncConstruct';
import { AppSyncLocalDatasourceConstruct } from './constructs/AppSyncLocalDatasourceConstruct';
import { AartsResolver, AppSyncLambdaDataSourceConstruct } from './constructs/appSyncLambdaDataSourceConstruct';
import { WorkerConstruct } from './constructs/workerConstruct';
import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import lambda = require('@aws-cdk/aws-lambda')
import { DynamoEventsConstruct } from './constructs/dynamoEventsConstruct';

let clientAppName: string, clientAppDirName: string
export { clientAppName, clientAppDirName }
export interface AartsInfraStackProps extends StackProps {
  clientAppName: string
  clientAppDirName: string
}

export class AartsAllInfraStack extends Stack {
  constructor(scope: App, id: string, props: AartsInfraStackProps) {
    super(scope, id, props);

    clientAppDirName = props.clientAppDirName
    clientAppName = props.clientAppName

    const nodeModulesLayer = new LayerVersion(this, props.clientAppName + 'Modules', {
      code: Code.fromAsset(join("node-modules-layer"), {
        exclude: [
          "aws-sdk"], follow: FollowMode.ALWAYS
      }),
      compatibleRuntimes: [Runtime.NODEJS_12_X],
      license: 'Apache-2.0',
      description: 'A layer holding the libraries needed for the contracts-compliant domain adapter',
    });

    // const s3Construct = new S3Construct(this, `Buckets`, {})

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

    const dynamoEventsConstruct = new DynamoEventsConstruct(this, "DynamoEvents", {
      eventBusConstruct, dynamoDbConstruct, nodeModulesLayer
    })

    const workerInputHandlerShort = new WorkerConstruct(this, `${props.clientAppName}HandlerShort`, {
      workerName: `${props.clientAppName}HandlerShort`,
      functionTimeout: Duration.seconds(10),
      functionHandler: "index.handler",
      functionImplementationPath: join(props.clientAppDirName, "dist"),
      functionRuntime: Runtime.NODEJS_12_X,
      eventBusConstruct: eventBusConstruct,
      dynamoDbConstruct: dynamoDbConstruct,
      eventSource: "worker:input:short",
      sqsRetries: 3,
      layers: [
        nodeModulesLayer
      ],
      reservedConcurrentExecutions: 25
    });

    const workerInputHandlerLong = new WorkerConstruct(this, `${props.clientAppName}HandlerLong`, {
      workerName: `${props.clientAppName}HandlerLong`,
      functionTimeout: Duration.minutes(10),
      functionHandler: "index.handler",
      functionImplementationPath: join(props.clientAppDirName, "dist"),
      functionRuntime: Runtime.NODEJS_12_X,
      eventBusConstruct: eventBusConstruct,
      dynamoDbConstruct: dynamoDbConstruct,
      eventSource: "worker:input:long",
      sqsRetries: 1,
      layers: [
        nodeModulesLayer
      ],
      reservedConcurrentExecutions: 25
    })

    if (!!this.node.tryGetContext("debug-mode")) {
      workerInputHandlerLong.function.addEnvironment("DEBUGGER", "1")
      workerInputHandlerShort.function.addEnvironment("DEBUGGER", "1")
      eventBusConstruct.eventDispatcher.addEnvironment("DEBUGGER", "1")
      dynamoEventsConstruct.dynamoEventsAggregation.addEnvironment("DEBUGGER", "1")
      dynamoEventsConstruct.dynamoEventsCallback.addEnvironment("DEBUGGER", "1")
      appSyncLocalDatasourceConstruct.notifierFunctionConstruct.function.addEnvironment("DEBUGGER", "1")
    }

    new CfnOutput(this, "aws_project_region", {
      description: "aws_project_region",
      value: this.region
    })
    new CfnOutput(this, "aws_cognito_identity_pool_id", {
      description: "aws_cognito_identity_pool_id",
      value: cognitoConstruct.identityPool.ref
    })
    new CfnOutput(this, "aws_user_pools_id", {
      description: "aws_user_pools_id",
      value: cognitoConstruct.userPool.userPoolId
    })
    new CfnOutput(this, "aws_user_pools_web_client_id", {
      description: "aws_user_pools_web_client_id",
      value: cognitoConstruct.webClient.userPoolClientId
    })
    new CfnOutput(this, "aws_appsync_graphqlEndpoint", {
      description: "aws_appsync_graphqlEndpoint",
      value: appSyncConstruct.graphQLApi.graphqlUrl
    })
  }
}
