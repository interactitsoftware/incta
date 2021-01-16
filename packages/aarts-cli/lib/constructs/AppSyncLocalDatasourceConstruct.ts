import { MappingTemplate, CfnDataSource, Resolver, CfnResolver } from '@aws-cdk/aws-appsync';
import { AppSyncConstruct } from './appSyncConstruct';
import { Construct, Duration } from '@aws-cdk/core';
import { Runtime, LayerVersion } from '@aws-cdk/aws-lambda';
import { EventBusConstruct } from './eventBusConstruct';
import { join } from 'path';
import { WorkerConstruct } from './workerConstruct';
import { ENV_VARS__APPSYNC_ENDPOINT_URL } from '../../env-constants';
import { Effect, PolicyStatement } from '@aws-cdk/aws-iam';
import { clientAppName, clientAppDirName } from "../aarts-all-infra-stack"
import { AartsConfig } from 'aarts-types';

export interface AppSyncLocalDatasourceConstructProps {
    appSyncConstruct: AppSyncConstruct
    eventBusConstruct: EventBusConstruct
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

        const feederLocalResolver = new Resolver(this, `LocalResolver`, {

            api: props.appSyncConstruct.graphQLApi,
            fieldName: 'feed',
            typeName: 'Mutation',
            requestMappingTemplate: MappingTemplate.fromString(
`{
    "version": "2017-02-28",
    "payload": {
        "item": "\${context.arguments.item}",
        "action": "\${context.arguments.action}",
        "identity": "$util.escapeJavaScript(\${context.arguments.identity})",
        "ringToken": "\${context.arguments.ringToken}",
        "eventSource": "\${context.arguments.eventSource}",
        "body": "$util.escapeJavaScript(\${context.arguments.body})",
        "sentAt": "$util.time.nowISO8601()"
    }
}`),
            responseMappingTemplate: MappingTemplate.fromString("$util.toJson($ctx.result)"),
        });
        (feederLocalResolver.node.defaultChild as CfnResolver).dataSourceName = localCfnDS.name
        feederLocalResolver.node.addDependency(localCfnDS);

        const aartsConfig = require(join(clientAppDirName, "aarts.config.json")) as AartsConfig
        this.notifierFunctionConstruct = new WorkerConstruct(this, "Feeder", {
            workerName: `${clientAppName}Feeder`,
            functionSQSFIFO: !!aartsConfig.Lambda.Feeder.SQSFIFO,
            functionTimeout: Duration.seconds(aartsConfig.Lambda.Feeder.Timeout),
            functionMemorySize: aartsConfig.Lambda.Feeder.RAM,
            functionHandler: "__bootstrap/index.feeder",
            functionImplementationPath: join(clientAppDirName, "dist"),
            functionRuntime: Runtime.NODEJS_12_X,
            eventBusConstruct: props.eventBusConstruct,
            eventSource: "worker:output",
            sqsRetries: 1,
            layers: [props.nodeModulesLayer]
        });

        this.notifierFunctionConstruct.function.addEnvironment(ENV_VARS__APPSYNC_ENDPOINT_URL, props.appSyncConstruct.graphQLApi.graphqlUrl);
        this.notifierFunctionConstruct.function.addToRolePolicy(new PolicyStatement({
            actions: ["appsync:GraphQL"],
            effect: Effect.ALLOW,
            resources: [`${props.appSyncConstruct.graphQLApi.arn}/types/Mutation/fields/feed`]
        }));
    }
}
