import cdk = require('@aws-cdk/core');
import cognito = require('@aws-cdk/aws-cognito');
import iam = require('@aws-cdk/aws-iam');
import { clientAppName } from "../aarts-all-infra-stack"

export interface CognitoConstructProps { }
// based on https://stackoverflow.com/questions/55784746/how-to-create-cognito-identitypool-with-cognito-userpool-as-one-of-the-authentic
export class CognitoConstruct extends cdk.Construct {

    public readonly userPool: cognito.IUserPool;
    public readonly identityPool: cognito.CfnIdentityPool
    public readonly webClient: cognito.UserPoolClient

    constructor(scope: cdk.Construct, id: string, props: CognitoConstructProps) {
        super(scope, id);

        const userPool = new cognito.UserPool(this, `UserPool`, {
            userPoolName: `${clientAppName}UserPool`,
            autoVerify: { email: true},
            userVerification: { },
            signInAliases: {
                email: true
            },
            signInCaseSensitive: true
        })
        const cfnUserPool = userPool.node.defaultChild as cognito.CfnUserPool;
        cfnUserPool.policies = {
            passwordPolicy: {
                minimumLength: 8,
                requireLowercase: false,
                requireNumbers: false,
                requireUppercase: false,
                requireSymbols: false
            }
        };
        const userPoolClient = new cognito.UserPoolClient(this, `UserPoolClient`, {
            generateSecret: false,
            userPool: userPool,
            userPoolClientName: `UserPoolClientName`,
            preventUserExistenceErrors: true
        });
        const identityPool = new cognito.CfnIdentityPool(this, `IdentityPool`, {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                clientId: userPoolClient.userPoolClientId,
                providerName: userPool.userPoolProviderName,
                serverSideTokenCheck: true
            }]
        });
        const unauthenticatedRole = new iam.Role(this, `DefaultUnauthenticatedRole`, {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
            }, "sts:AssumeRoleWithWebIdentity"),
        });
        //#region we do not want unauthenticated access
        // unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
        //     effect: iam.Effect.ALLOW,
        //     actions: [
        //         // "mobileanalytics:PutEvents",
        //         "cognito-sync:*"
        //     ],
        //     resources: ["*"],
        // }));
        //#endregion
        const authenticatedRole = new iam.Role(this, `DefaultAuthenticatedRole`, {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
            }, "sts:AssumeRoleWithWebIdentity"),
        });
        authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "cognito-identity:*"
            ],
            resources: ["*"],
        }));
        const defaultPolicy = new cognito.CfnIdentityPoolRoleAttachment(this, `DefaultValidAttachment`, {
            identityPoolId: identityPool.ref,
            roles: {
                'unauthenticated': unauthenticatedRole.roleArn,
                'authenticated': authenticatedRole.roleArn
            }
        });

        //#region add user pool groups
        // TODO define roles for each group and test
        // TODO how to automatically change the "authentication role selection"
        new cognito.CfnUserPoolGroup(this, `UsersGroup`, {
            userPoolId: userPool.userPoolId,
            groupName: 'user',
        });
        new cognito.CfnUserPoolGroup(this, `SuperUsersGroup`, {
            userPoolId: userPool.userPoolId,
            groupName: 'superuser',
        });
        new cognito.CfnUserPoolGroup(this, `AdminsGroup`, {
            userPoolId: userPool.userPoolId,
            groupName: 'admin',
        });
        //#endregion

        this.userPool = userPool
        this.identityPool = identityPool
        this.webClient = userPoolClient
    }
}