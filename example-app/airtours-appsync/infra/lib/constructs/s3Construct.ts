import cdk = require('@aws-cdk/core')
import s3 = require('@aws-cdk/aws-s3')

export interface S3ConstructProps {
    clientAppName : string
}

export class S3Construct extends cdk.Construct {

    public readonly operationsBucket: s3.Bucket
    public readonly resourceBucket: s3.Bucket

    constructor(scope: cdk.Construct, id: string, props: S3ConstructProps) {
        super(scope, id);

        this.operationsBucket = new s3.Bucket(this, `OperationsBucket`, {
            bucketName: `${props.clientAppName.toLowerCase()}-operations-bucket`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            cors: [
                {
                    id:'allow_cors',
                    allowedMethods: [
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.GET,
                        s3.HttpMethods.HEAD,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    exposedHeaders: [
                        'x-amz-server-side-encryption',
                        'x-amz-request-id',
                        'x-amz-id-2',
                        'ETag',
                    ]
                }
            ]
        })

        this.resourceBucket = new s3.Bucket(this, `ResourceBucket`, {
            bucketName: `${props.clientAppName.toLowerCase()}-resource-bucket`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
    }
}