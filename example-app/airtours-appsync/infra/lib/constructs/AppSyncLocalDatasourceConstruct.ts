import { MappingTemplate, CfnDataSource, Resolver, CfnResolver } from '@aws-cdk/aws-appsync';
import { AppSyncConstruct } from './appSyncConstruct';
import { Construct, Duration } from '@aws-cdk/core';
import { Runtime, LayerVersion } from '@aws-cdk/aws-lambda';
import { EventBusConstruct } from './eventBusConstruct';
import { join } from 'path';
import { WorkerConstruct } from './workerConstruct';
import { ENV_VARS__APPSYNC_ENDPOINT_URL } from '../../env-constants';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';

export interface AppSyncLocalDatasourceConstructProps {
    appSyncConstruct: AppSyncConstruct
    eventBusConstruct: EventBusConstruct
    clientAppName: string
    nodeModulesLayer: LayerVersion
}

export class AppSyncLocalDatasourceConstruct extends Construct {

    public readonly notifierFunctionConstruct: WorkerConstruct
    constructor(scope: Construct, id: string, props: AppSyncLocalDatasourceConstructProps) {
        super(scope, id)
        
//#region LOCAL DATASOURCE
const localCfnDS = new CfnDataSource(this, `LocalDS`, {

    apiId: props.appSyncConstruct.graphQLApi.apiId,
    name: 'echo',
    type: 'NONE',
    description: 'loopback datasource',
});

const notifyLocalResolver = new Resolver(this, `LocalResolver`, {

    api: props.appSyncConstruct.graphQLApi,
    fieldName: 'notify',
    typeName: 'Mutation',
    requestMappingTemplate: MappingTemplate.fromString(
`{
"version": "2017-02-28",
"payload": {
"body": "$util.escapeJavaScript(\${context.arguments.body})",
"from": "\${context.identity.username}",
"to": "\${context.arguments.to}",
"sentAt": "$util.time.nowISO8601()"
}
}`),
    responseMappingTemplate: MappingTemplate.fromString("$util.toJson($ctx.result)"),
});
(notifyLocalResolver.node.defaultChild as CfnResolver).dataSourceName = localCfnDS.name

    this.notifierFunctionConstruct = new WorkerConstruct(this, "Notify", {
        workerName: `${props.clientAppName}Notifier`,
        functionTimeout: Duration.seconds(30),
        functionHandler: "index.notifier",
        functionImplementationPath: join("..", props.clientAppName, "dist"),
        functionRuntime: Runtime.NODEJS_12_X,
        eventBusConstruct: props.eventBusConstruct,
        eventSource: "worker:output",
        layers: [props.nodeModulesLayer]
    });

    this.notifierFunctionConstruct.function.addEnvironment(ENV_VARS__APPSYNC_ENDPOINT_URL, props.appSyncConstruct.graphQLApi.graphQlUrl);
    this.notifierFunctionConstruct.function.addToRolePolicy(new PolicyStatement ({
        actions: ["appsync:GraphQL"],
        effect: Effect.ALLOW,
        resources: [ `${props.appSyncConstruct.graphQLApi.arn}/types/Mutation/fields/notify` ]
    }));
    }
}
