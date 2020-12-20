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
    layers?: ILayerVersion[] | undefined,
    sqsRetries: number,
    eventSourceBatchSize?: number
}

export class WorkerConstruct extends Construct {

    public readonly function: Function

    constructor(scope: Construct, id: string, props: WorkerConstructProps) {
        super(scope, id);
        const functionDeadletterQueue = new Queue(this, "DEADLETTER", {
            queueName: `${props.workerName}-DEADLETTER`
        })
        const functionQueue = new Queue(this, "Queue", {
            // as per best practices from AWS visibilityTimeout is suggesteed 6 times lambda timeout
            // however we reduce to only 2 the lambda timeout, as we do not have retries in the lambda
            visibilityTimeout: Duration.seconds(2 * props.functionTimeout.toSeconds()),
            receiveMessageWaitTime: Duration.seconds(3), // long polling for events
            queueName: `${props.workerName}`,
            // defining DLQ on SQS level, see https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#invocation-async-api
            deadLetterQueue: {
                maxReceiveCount: props.sqsRetries,
                queue: functionDeadletterQueue,
            }
        })
        functionQueue.node.addDependency(functionDeadletterQueue)

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

            // DLQ enabled on a Queue level, see https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html#invocation-async-api
            // but lambda is also setup to have its own DLQ, according to this article: https://aws.amazon.com/blogs/compute/designing-durable-serverless-apps-with-dlqs-for-amazon-sns-amazon-sqs-aws-lambda/
            // so far testing it, lambda's DLQ never gets used, only the SQS DLQ

            environment: {"QUEUE_URL": functionQueue.queueUrl, ...props.envVars},

            events: [new SqsEventSource(functionQueue,
                {
                    batchSize: props.eventSourceBatchSize || 1
                })
            ],
            // unlike the dispatcher who must not have retries
            // workers must have retries - to tackle dynamo scaling events or transaction conflicting events
            // or any other application specific situations resulting in error

            // WARNING 1) make sure domain logic is idempotent
            retryAttempts: 0, // WARNING 2) with SQS event source for the lambda, retries are actually controlled via the maxReceiveCount above, 
            // and a DLQ attached there, will be used only if the lambda is called asynchronously (--invocation-type=Event)
            // disabling it for now, as within aarts framework lambdas are not expected to be called outside the SNS-SQS topology
            // deadLetterQueueEnabled: true,
            // deadLetterQueue: new Queue(this, "DEADLETTER-LAMBDA", {
            //     queueName: `${props.workerName}-DEADLETTER-LAMBDA`
            // }),

            reservedConcurrentExecutions: props.reservedConcurrentExecutions,
            layers: props.layers
        })

        if (!!props.eventBusConstruct) {
            this.function.node.addDependency(props.eventBusConstruct.eventBus)
            functionQueue.node.addDependency(props.eventBusConstruct.eventBus)
            props.eventBusConstruct.grantAccess(this.function)
        }

        if (props.dynamoDbConstruct) {
            this.function.node.addDependency(props.dynamoDbConstruct)
            props.dynamoDbConstruct?.grantAccess(this.function)
        }
    }
}

