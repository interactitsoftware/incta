import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import { LambdaDataSource, MappingTemplate } from '@aws-cdk/aws-appsync';
import { AppSyncConstruct } from './appSyncConstruct';

export interface AppSyncLambdaDataSourceConstructProps {
    appSyncConstruct: AppSyncConstruct
    lambdaFunction: lambda.Function
    mutateResolvers: Set<string>
    queryResolvers: Set<string>
}

export class AppSyncLambdaDataSourceConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: AppSyncLambdaDataSourceConstructProps) {
        super(scope, id)
        
        const mappingTemplate = (resolver: string) => MappingTemplate.fromString(
`{
    "version": "2017-02-28",
    "operation": "Invoke",
    "payload": {
        "action": "${resolver}",
        "item": "$context.arguments.item",
        "arguments": $utils.toJson($context.arguments),
        "identity": $utils.toJson($context.identity)
    }
}`)
        const createResolvers = (lds: LambdaDataSource, resolvers: Set<string>, typeName: string) =>
        resolvers.forEach(resolver => {
            if (isNaN(Number(resolver))) {
                lds.createResolver({
                    fieldName: resolver,
                    typeName: typeName,
                    requestMappingTemplate: mappingTemplate(resolver),
                    responseMappingTemplate: MappingTemplate.fromString("$util.toJson($ctx.result)"),
                });
            }
        })

        const lds = new LambdaDataSource(this, 'DS', {
            api: props.appSyncConstruct.graphQLApi,
            lambdaFunction: props.lambdaFunction,
            name: "Lambda"
        })
        createResolvers(lds, props.mutateResolvers, "Mutation")
        createResolvers(lds, props.queryResolvers, "Query")
    }
}
