import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { Duration, Construct } from '@aws-cdk/core'
import { EventBusConstruct } from './eventBusConstruct';
import { DynamoDBConstruct } from './dynamoDbConstruct';
import { SqsSubscription } from '@aws-cdk/aws-sns-subscriptions';
import { Queue } from '@aws-cdk/aws-sqs';
import { Runtime, Code, Function, ILayerVersion, Tracing } from '@aws-cdk/aws-lambda';
import { FollowMode } from '@aws-cdk/assets';

export interface WorkerConstructProps {
    workerName: string,
    eventBusConstruct?: EventBusConstruct
    dynamoDbConstruct?: DynamoDBConstruct
    eventSource: string
    functionImplementationPath: string
    functionHandler: string
    functionRuntime: Runtime
    functionTimeout: Duration
    envVars?: { [key: string]: string }
    reservedConcurrentExecutions?: number
    layers?: ILayerVersion[] | undefined
}

export class WorkerConstruct extends Construct {

    public readonly function: Function

    constructor(scope: Construct, id: string, props: WorkerConstructProps) {
        super(scope, id);

        const functionQueue = new Queue(this, "Queue", {
            visibilityTimeout: Duration.seconds(6 * props.functionTimeout.toSeconds()),
            receiveMessageWaitTime: Duration.seconds(3), // long polling for events
            queueName: `${props.workerName}`,
            deadLetterQueue: { // defining DLQ on SQS level, see https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#invocation-async-api
                maxReceiveCount: 10,
                queue: new Queue(this, "DEADLETTER", {
                    queueName: `${props.workerName}-DEADLETTER`
                }),
            }
        })

        props.eventBusConstruct?.eventBus.addSubscription(new SqsSubscription(functionQueue, {
            rawMessageDelivery: true,
            filterPolicy: {
                eventSource: {
                    conditions: [
                        { prefix: props.eventSource }
                    ]
                }
            }
        }))

        this.function = new Function(this, "Worker", {
            code: Code.fromAsset(props.functionImplementationPath, {
                exclude: ["aws-sdk"], follow: FollowMode.ALWAYS
            }),
            handler: props.functionHandler,
            runtime: props.functionRuntime,
            timeout: props.functionTimeout,
            memorySize: 256,
            functionName: `${props.workerName}`,
            tracing: Tracing.ACTIVE,

            // DLQ enabled on a Queue level, not here, see https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#invocation-async-api
            // deadLetterQueueEnabled: true,
            // deadLetterQueue: new Queue(this, "DEADLETTER"),

            environment: props.envVars,

            events: [new SqsEventSource(functionQueue,
                {
                    batchSize: 10
                })
            ],
            // unlike the dispatcher who must not have retries
            // workers must have retries - to tackle dynamo scaling events or transaction conflicting events
            // or any other application specific situations resulting in error
            // WARNING make sure domain logic is idempotent
            retryAttempts: 2,

            reservedConcurrentExecutions: props.reservedConcurrentExecutions,
            layers: props.layers
        })

        props.eventBusConstruct?.grantAccess(this.function);
        props.dynamoDbConstruct?.grantAccess(this.function);

    }
}

