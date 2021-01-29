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
import { DynamoEventsConstruct } from './constructs/dynamoEventsConstruct';
import { AartsConfig } from 'aarts-types';

let clientAppName: string, clientAppDirName: string
export { clientAppName, clientAppDirName }
export interface AartsInfraStackProps extends StackProps {
  clientAppName: string
  clientAppDirName: string
  copyEntireItemToGsis: string
}

export class AartsAllInfraStack extends Stack {
  constructor(scope: App, id: string, props: AartsInfraStackProps) {
    super(scope, id, props);

    clientAppDirName = props.clientAppDirName
    clientAppName = props.clientAppName
    const aartsConfig = require(join(clientAppDirName, "aarts.config.json")) as AartsConfig

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

    const dynamoDbConstruct = new DynamoDBConstruct(this, 'DB', {
      copyEntireItemToGsis: props.copyEntireItemToGsis
    })

    const eventBusConstruct = new EventBusConstruct(this, `Events`, {
      nodeModulesLayer,
      dynamoDbConstruct,
      controllerConfig: aartsConfig.Lambda.Controller,
      asyncCUD: !!aartsConfig.AsyncCUD
    })
    const cognitoConstruct = new CognitoConstruct(this, `Auth`, { eventBusConstruct });
    const appSyncConstruct = new AppSyncConstruct(this, `AppSync`, {
      cognitoConstruct: cognitoConstruct
    })

    const appSyncLambdaDatasourceConstruct = new AppSyncLambdaDataSourceConstruct(this, "Mutation", {
      lambdaFunction: eventBusConstruct.controller,
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
      eventBusConstruct,
      appSyncConstruct,
      nodeModulesLayer,
      feederConfig: aartsConfig.Lambda.Feeder
    })

    const dynamoEventsConstruct = new DynamoEventsConstruct(this, `${props.clientAppName}DynamoEvents`, {
      eventBusConstruct, dynamoDbConstruct, nodeModulesLayer, 
      aggregationFunctionConfig: aartsConfig.Lambda.DynamoStreamsProcessors.Aggregation,
      callbackFunctionConfig: aartsConfig.Lambda.DynamoStreamsProcessors.ItemCallbacks
    })

    for (const worker of aartsConfig.Lambda.Workers) {
      const workerFunction = new WorkerConstruct(this, `${props.clientAppName}Worker${worker.name}`, {
        workerName: `${props.clientAppName}Worker${worker.name}`,
        workerConfig: worker,
        functionHandler: "__bootstrap/index.worker",
        functionImplementationPath: join(props.clientAppDirName, "dist"),
        functionRuntime: Runtime.NODEJS_12_X,
        eventBusConstruct: eventBusConstruct,
        dynamoDbConstruct: dynamoDbConstruct,
        eventSource: `worker:input:${worker.name.toLowerCase()}`,
        layers: [
          nodeModulesLayer
        ],
      });
      eventBusConstruct.controller.addEnvironment(`WORKER_${worker.name.toUpperCase()}`, workerFunction.function.functionName)
      if (!!this.node.tryGetContext("debug-mode")) {
        workerFunction.function.addEnvironment("DEBUGGER", "1")
      }
    }

    if (!!this.node.tryGetContext("debug-mode")) {
      eventBusConstruct.controller.addEnvironment("DEBUGGER", "1")
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
