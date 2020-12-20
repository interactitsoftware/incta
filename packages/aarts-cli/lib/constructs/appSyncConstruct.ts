import cdk = require('@aws-cdk/core');
import { Function } from '@aws-cdk/aws-lambda';
import { AuthorizationType, GraphqlApi, UserPoolDefaultAction } from '@aws-cdk/aws-appsync';
import { CognitoConstruct } from './cognitoConstruct';
import { clientAppDirName, clientAppName } from "../aarts-all-infra-stack"

export interface AppSyncConstructProps {
    cognitoConstruct: CognitoConstruct
}

export class AppSyncConstruct extends cdk.Construct {
    public readonly graphQLApi: GraphqlApi
    public readonly notifierFunction: Function

    constructor(scope: cdk.Construct, id: string, props: AppSyncConstructProps) {
        super(scope, id)

        this.graphQLApi = new GraphqlApi(this, 'AppSync', {
            name: `${clientAppName}AppSync`,

            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: props.cognitoConstruct.userPool,
                        defaultAction: UserPoolDefaultAction.ALLOW
                    },
                },
                additionalAuthorizationModes: [
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
        this.graphQLApi.schema.definition = gqlSchemaTemplate
            .replace(/##MUTATION##/g, "")
            .replace(/##QUERY##/g, "")
            .replace(/##SUBSCRIPTION##/g, "")
            .replace(/##DOMAINTYPE##/g, "")

        //         this.graphQLApi.schema.definition = `

        // schema {
        //     query: Query
        //     mutation: Mutation
        //     subscription: Subscription
        // }

        // type Mutation {
        //     start(item: String!, payload: AWSJSON): AWSJSON
        //     create(item: String!, payload: AWSJSON!): AWSJSON
        //     update(item: String!, payload: AWSJSON!): AWSJSON
        //     delete(item: String!, payload: AWSJSON!): AWSJSON
        //     feed(item: String!, action: String!, identity: String!, ringToken: String!, eventSource: String!, body: String!): Notification @aws_iam @aws_cognito_user_pools
        // }

        // type Query {
        //     get(item: String, payload: AWSJSON!): AWSJSON 
        //     query(item: String, payload: AWSJSON!): AWSJSON
        // }

        // type Subscription {
        //     inbox(item: String, action: String, identity: String, ringToken: String, eventSource: String): Notification @aws_subscribe(mutations: ["feed"])
        // }

        // type Notification @aws_iam @aws_cognito_user_pools{
        //     item: String!
        //     action: String!
        //     identity: String!
        //     ringToken: String!
        //     eventSource: String!
        //     body: String!
        //     sentAt: String!
        // }
        // `
    }
}

const gqlSchemaTemplate =
    `
schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
}

type Mutation {
    start(item: String!, payload: AWSJSON): AWSJSON
    create(item: String!, payload: AWSJSON!): AWSJSON
    update(item: String!, payload: AWSJSON!): AWSJSON
    delete(item: String!, payload: AWSJSON!): AWSJSON
    feed(item: String!, action: String!, identity: String!, ringToken: String!, eventSource: String!, body: String!): Notification @aws_iam @aws_cognito_user_pools

    ##MUTATION##
}

type Query {
    get(item: String, payload: AWSJSON!): AWSJSON 
    query(item: String, payload: AWSJSON!): AWSJSON

    ##QUERY##
}

type Subscription {
    inbox(item: String, action: String, identity: String, ringToken: String, eventSource: String): Notification @aws_subscribe(mutations: ["feed"]) @aws_iam @aws_cognito_user_pools

    ##SUBSCRIPTION##
}

type Notification @aws_iam @aws_cognito_user_pools{
    item: String!
    action: String!
    identity: String!
    ringToken: String!
    eventSource: String!
    body: String!
    sentAt: String!
}

##DOMAINTYPE##
`
