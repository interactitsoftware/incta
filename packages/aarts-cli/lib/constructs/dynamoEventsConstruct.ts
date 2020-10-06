import cdk = require('@aws-cdk/core')
import lambda = require('@aws-cdk/aws-lambda')
import { Duration } from '@aws-cdk/core'
import { join } from 'path';
import { LayerVersion, Code, StartingPosition } from '@aws-cdk/aws-lambda';
import { FollowMode } from '@aws-cdk/assets';
import { DynamoDBConstruct } from './dynamoDbConstruct';
import { clientAppDirName, clientAppName } from "../aarts-all-infra-stack"
import { EventBusConstruct } from './eventBusConstruct';
import { Runtime } from '@aws-cdk/aws-lambda/lib/runtime';
import { DynamoEventSource, SqsDlq } from '@aws-cdk/aws-lambda-event-sources';
import { Queue } from '@aws-cdk/aws-sqs';

export interface DynamoEventsConstructProps {
    nodeModulesLayer: LayerVersion,
    dynamoDbConstruct: DynamoDBConstruct,
    eventBusConstruct: EventBusConstruct
}

export class DynamoEventsConstruct extends cdk.Construct {

    public readonly dynamoEventsAggregation: lambda.Function
    public readonly dynamoEventsCallback: lambda.Function

    constructor(scope: cdk.Construct, id: string, props: DynamoEventsConstructProps) {
        super(scope, id);

        this.dynamoEventsAggregation = new lambda.Function(this, "Aggregation", {
            runtime: Runtime.NODEJS_12_X,
            functionName: `${clientAppName}dynamoEventsAggregation`,
            code: Code.fromAsset(join(clientAppDirName, "dist"), { exclude: ["aws-sdk"], follow: FollowMode.ALWAYS }),
            handler: 'index.dynamoEventsAggregation',
            memorySize: 256,
            timeout: Duration.seconds(60),
            layers: [props.nodeModulesLayer],

            // IMPORTANT we dont want retry on a dispatcher level, reties should be only on sqs handler level
            // because if dispatcher reties, it will generate new ringToken, which may result in duplicate items, 
            // out of single create events (which got failed, and retried)
            retryAttempts: 0,
            reservedConcurrentExecutions: 1
        })
        // props.eventBusConstruct.grantAccess(this.dynamoEventsAggregation)
        props.dynamoDbConstruct.grantAccess(this.dynamoEventsAggregation)


        const dlq = new Queue(this, "AggregationDEADLETTER", {
            queueName: `dynamoEventsAggregation-DEADLETTER`
        })
        dlq.grantSendMessages(this.dynamoEventsAggregation)

        this.dynamoEventsAggregation.addEventSource(new DynamoEventSource(props.dynamoDbConstruct.table, {
            startingPosition: StartingPosition.LATEST,
            batchSize: 1000,
            bisectBatchOnError: true,
            parallelizationFactor: 1,
            maxBatchingWindow: Duration.seconds(30),
            onFailure: {
                bind: (iEventSourceMapping, lambda) => { return { destination: dlq.queueArn} }
            }
        }))

        //---------

        this.dynamoEventsCallback = new lambda.Function(this, "Callback", {
            runtime: Runtime.NODEJS_12_X,
            functionName: `${clientAppName}dynamoEventsCallback`,
            code: Code.fromAsset(join(clientAppDirName, "dist"), { exclude: ["aws-sdk"], follow: FollowMode.ALWAYS }),
            handler: 'index.dynamoEventsCallback',
            memorySize: 256,
            timeout: Duration.seconds(60),
            layers: [props.nodeModulesLayer],

            // IMPORTANT we dont want retry on a dispatcher level, reties should be only on sqs handler level
            // because if dispatcher reties, it will generate new ringToken, which may result in duplicate items, 
            // out of single create events (which got failed, and retried)
            retryAttempts: 0,
            reservedConcurrentExecutions: 1
        })
        props.eventBusConstruct.grantAccess(this.dynamoEventsCallback)
        props.dynamoDbConstruct.grantAccess(this.dynamoEventsCallback)


        const dlqCb = new Queue(this, "CallbackDEADLETTER", {
            queueName: `dynamoEventsCallback-DEADLETTER`
        })
        dlqCb.grantSendMessages(this.dynamoEventsCallback)

        this.dynamoEventsCallback.addEventSource(new DynamoEventSource(props.dynamoDbConstruct.table, {
            startingPosition: StartingPosition.LATEST,
            batchSize: 1,
            bisectBatchOnError: true,
            parallelizationFactor: 1,
            maxBatchingWindow: Duration.seconds(0),
            onFailure: {
                bind: (iEventSourceMapping, lambda) => { return { destination: dlqCb.queueArn} }
            }
        }))
    }
}