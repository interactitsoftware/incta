import cdk = require('@aws-cdk/core')
import lambda = require('@aws-cdk/aws-lambda')
import sns = require('@aws-cdk/aws-sns')
import sqs = require('@aws-cdk/aws-sqs')
import snsSubs = require('@aws-cdk/aws-sns-subscriptions');
import { Duration } from '@aws-cdk/core'
import { join } from 'path';
import { LayerVersion, Code, Tracing } from '@aws-cdk/aws-lambda';
import { FollowMode } from '@aws-cdk/assets';
import { DynamoDBConstruct } from './dynamoDbConstruct';
import { clientAppDirName, clientAppName } from "../aarts-all-infra-stack"
import { ENV_VARS__ASYNC_CUD, ENV_VARS__EVENT_BUS_TOPIC } from '../../env-constants';
import { FunctionConfig } from 'aarts-types';

export interface EventBusConstructProps {
    nodeModulesLayer: LayerVersion,
    dynamoDbConstruct: DynamoDBConstruct,
    controllerConfig: FunctionConfig,
    asyncCUD: boolean
}

export class EventBusConstruct extends cdk.Construct {

    public readonly eventBus: sns.Topic
    public readonly controller: lambda.Function

    constructor(scope: cdk.Construct, id: string, props: EventBusConstructProps) {
        super(scope, id);
        this.eventBus = new sns.Topic(this, 'Bus')

        if (!!this.node.tryGetContext("debug-mode")) {
            //#region test queues consuming all the messages
            // TODO reflect AartsConfig and add test queue for each worker, if in debug mode
            var testOutputQueue = new sqs.Queue(this, "TESTOUTPUTQUEUE", {
                retentionPeriod: Duration.hours(12)
            });
            this.eventBus.addSubscription(new snsSubs.SqsSubscription(testOutputQueue, {
                rawMessageDelivery: true,
                filterPolicy: {
                    eventSource: {
                        conditions: [
                            { prefix: "worker:output" }
                        ]
                    }
                }
            }));
            var testInputShortQueue = new sqs.Queue(this, "TESTINPUTSHORTQUEUE", {
                retentionPeriod: Duration.hours(12)
            });
            this.eventBus.addSubscription(new snsSubs.SqsSubscription(testInputShortQueue, {
                rawMessageDelivery: true,
                filterPolicy: {
                    eventSource: {
                        conditions: [
                            { prefix: "worker:input:short" }
                        ]
                    }
                }
            }));
            var testInputLongQueue = new sqs.Queue(this, "TESTINPUTLONGQUEUE", {
                retentionPeriod: Duration.hours(12)
            });
            this.eventBus.addSubscription(new snsSubs.SqsSubscription(testInputLongQueue, {
                rawMessageDelivery: true,
                filterPolicy: {
                    eventSource: {
                        conditions: [
                            { prefix: "worker:input:long" }
                        ]
                    }
                }
            }));
            //#endregion
        }

        this.controller = new lambda.Function(this, "Controller", {
            runtime: lambda.Runtime.NODEJS_12_X,
            functionName: `${clientAppName}Controller`,
            code: Code.fromAsset(join(clientAppDirName, "dist"), { exclude: ["aws-sdk"], follow: FollowMode.ALWAYS }),
            handler: '__bootstrap/index.controller',
            memorySize: props.controllerConfig.RAM,
            timeout: cdk.Duration.seconds(props.controllerConfig.Timeout),
            layers: [props.nodeModulesLayer],

            // IMPORTANT we dont want retry on a dispatcher level, reties should be only on sqs handler level
            // because if dispatcher reties, it will generate new ringToken, which may result in duplicate items, 
            // out of single create events (which got failed, and retried)
            retryAttempts: 0,
            tracing: !!props.controllerConfig.XRayTracing? Tracing.ACTIVE : Tracing.DISABLED,
            
            // note reservedConcurrentExecutions not set from config on purpose, we dont want to limit that lambda,
        })
        this.grantAccess(this.controller)
        props.dynamoDbConstruct.grantAccess(this.controller)
        if (!!props.asyncCUD) {
            this.controller.addEnvironment(ENV_VARS__ASYNC_CUD, "1")
        }
    }

    grantAccess(lambdaFunction: lambda.Function) {
        this.eventBus.grantPublish(lambdaFunction)
        lambdaFunction.addEnvironment(ENV_VARS__EVENT_BUS_TOPIC, this.eventBus.topicArn)
    }
}