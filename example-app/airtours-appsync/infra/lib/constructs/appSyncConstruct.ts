import cdk = require('@aws-cdk/core');
import { join } from 'path'
import appsync = require('@aws-cdk/aws-appsync');
import { Function, Runtime } from '@aws-cdk/aws-lambda';
import iam = require('@aws-cdk/aws-iam');
import { CfnResolver, CfnGraphQLApi, GraphQLApi, MappingTemplate, AuthorizationType } from '@aws-cdk/aws-appsync';
import { CognitoConstruct } from './cognitoConstruct';
import { DynamoDBConstruct } from './dynamoDbConstruct';
import { UserPool } from '@aws-cdk/aws-cognito';
import { WorkerConstruct } from './workerConstruct';
import { Duration } from '@aws-cdk/core';
import { isObject } from 'util';
import { fstat } from 'fs';

export interface AppSyncConstructProps {

    clientAppName: string
    cognitoConstruct: CognitoConstruct
}

export class AppSyncConstruct extends cdk.Construct {
    public readonly graphQLApi: GraphQLApi
    public readonly notifierFunction: Function

    constructor(scope: cdk.Construct, id: string, props: AppSyncConstructProps) {
        super(scope, id)

        this.graphQLApi = new appsync.GraphQLApi(this, 'AppSync', {
            name: `${props.clientAppName}AppSync`,
            schemaDefinition: `

 schema {
     query: Query
     mutation: Mutation
     subscription: Subscription
 }

 type Mutation {
    start(item: String!, payload: AWSJSON): AWSJSON
    create(item: String!, payload: AWSJSON): AWSJSON
    update(item: String!, payload: AWSJSON): AWSJSON
    delete(item: String!, payload: AWSJSON): AWSJSON
    notify(to: String!, body: String!): Notification @aws_iam @aws_cognito_user_pools
 }

 type Query {
    get(item: String!, payload: AWSJSON): AWSJSON 
    list(item: String!, payload: AWSJSON): AWSJSON
 }

 type Subscription {
    inbox(to: String!): Notification @aws_subscribe(mutations: ["notify"])
 }

 type Notification @aws_iam @aws_cognito_user_pools{
	from: String!
	to: String!
	body: String!
	sentAt: String!
}
`,

            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: props.cognitoConstruct.userPool,
                        defaultAction: appsync.UserPoolDefaultAction.ALLOW
                    },
                },
                additionalAuthorizationModes:[
                    {
                        // todo comment "below code" and test if they implemented it
                        authorizationType: AuthorizationType.IAM
                        // TODO because of lack of support by now we use 'below code' to add AWS_IAM
                        //https://github.com/aws/aws-cdk/issues/6247
                    }
                ]
            }
        });
        // // below code:
        // ((this.graphQLApi.node.defaultChild as CfnGraphQLApi).additionalAuthenticationProviders as Array<CfnGraphQLApi.AdditionalAuthenticationProviderProperty>).push({
        //     authenticationType: 'AWS_IAM',
        // });
    }
}
