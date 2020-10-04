import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import { LambdaDataSource, MappingTemplate } from '@aws-cdk/aws-appsync';
import { AppSyncConstruct } from './appSyncConstruct';

export type AartsResolver = {name:string, jobType: "long" | "short" }

export interface AppSyncLambdaDataSourceConstructProps {
    appSyncConstruct: AppSyncConstruct
    lambdaFunction: lambda.Function
    mutateResolvers: Set<AartsResolver>
    queryResolvers:Set<AartsResolver>
}

export class AppSyncLambdaDataSourceConstruct extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: AppSyncLambdaDataSourceConstructProps) {
        super(scope, id)
        
        const mappingTemplate = (resolver: AartsResolver) => MappingTemplate.fromString(
`{
    "version": "2017-02-28",
    "operation": "Invoke",
    "payload": {
        "action": "${resolver.name}",
        "jobType": "${resolver.jobType}",
        "item": "$context.arguments.item",
        "arguments": $utils.toJson($context.arguments.payload),
        "selectionSetList": $utils.toJson($ctx.info.selectionSetList),
        "identity": $utils.toJson($context.identity)
    }
}`)
        const createResolvers = (lds: LambdaDataSource, resolvers: Set<AartsResolver>, typeName: string) =>
        resolvers.forEach(resolver => {
            if (isNaN(Number(resolver))) {
                lds.createResolver({
                    fieldName: resolver.name,
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


        // props.appSyncConstruct.graphQLApi.schema.addQuery('queryS', {
        //     type: Type.AWS_JSON,
        //     isList:false,
        //     isRequired:false,
        //     isRequiredList: false,
        //     argsToString: ()=>'item: String',
        //     directivesToString: () => '@aws_iam @aws_cognito_user_pools'
        // })


    }
}
