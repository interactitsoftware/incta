import cdk = require('@aws-cdk/core');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import { Function } from '@aws-cdk/aws-lambda'
import { BillingMode, AttributeType, StreamViewType, ProjectionType, Table } from '@aws-cdk/aws-dynamodb';
import { RemovalPolicy } from '@aws-cdk/core';
import { ENV_VARS__DB_NAME, ENV_VARS__TEST_DB_NAME, ENV_VARS__DB_ENDPOINT } from '../../env-constants';
import { clientAppDirName, clientAppName } from "../aarts-all-infra-stack"
import { Model } from '@aws-cdk/aws-apigateway';
import { join } from 'path';
import { AartsConfig, DataModel } from "aarts-types/interfaces"
import { threadId } from 'worker_threads';

export interface DynamoDBConstructProps { 
  copyEntireItemToGsis: string
}
export class DynamoDBConstruct extends cdk.Construct {

  public readonly table: dynamodb.Table;
  public readonly testTable: dynamodb.Table;


  constructor(scope: cdk.Construct, id: string, props: DynamoDBConstructProps) {
    super(scope, id);
    const dataModel = require(join(clientAppDirName, "data-model.json")) as DataModel
    const aartsConfig = require(join(clientAppDirName, "aarts.config.json")) as AartsConfig

    const createTableV1 = (isTestTable?: boolean) => {
      const table = new Table(this, `${isTestTable ? `TEST${clientAppName}` : clientAppName}`, {
        tableName: `${isTestTable ? `TEST${clientAppName}` : clientAppName}`,
        partitionKey: { name: "id", type: AttributeType.STRING },
        sortKey: { name: "meta", type: AttributeType.STRING },

        // billingMode: BillingMode.PROVISIONED,
        // readCapacity: 1,
        // writeCapacity: 1,

        billingMode: BillingMode.PAY_PER_REQUEST,

        stream: StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: RemovalPolicy.DESTROY 
      })

      table.addGlobalSecondaryIndex({
        indexName: "meta__smetadata",
        partitionKey: { name: "meta", type: AttributeType.STRING },
        sortKey: { name: "smetadata", type: AttributeType.STRING },
        projectionType: !!props.copyEntireItemToGsis && props.copyEntireItemToGsis !== "undefined" ? ProjectionType.ALL : ProjectionType.KEYS_ONLY,
        // readCapacity: 1,
        // writeCapacity: 1,
      })

      table.addGlobalSecondaryIndex({
        indexName: "meta__nmetadata",
        partitionKey: { name: "meta", type: AttributeType.STRING },
        sortKey: { name: "nmetadata", type: AttributeType.NUMBER },
        projectionType: !!props.copyEntireItemToGsis && props.copyEntireItemToGsis !== "undefined" ? ProjectionType.ALL : ProjectionType.KEYS_ONLY,
        // readCapacity: 1,
        // writeCapacity: 1,
      })

      table.addGlobalSecondaryIndex({
        indexName: "smetadata__meta",
        partitionKey: { name: "smetadata", type: AttributeType.STRING },
        sortKey: { name: "meta", type: AttributeType.STRING },
        projectionType: !!props.copyEntireItemToGsis && props.copyEntireItemToGsis !== "undefined" ? ProjectionType.ALL : ProjectionType.KEYS_ONLY,
        // readCapacity: 1,
        // writeCapacity: 1,
      })

      table.addGlobalSecondaryIndex({
        indexName: "nmetadata__meta",
        partitionKey: { name: "nmetadata", type: AttributeType.NUMBER },
        sortKey: { name: "meta", type: AttributeType.STRING },
        projectionType: !!props.copyEntireItemToGsis && props.copyEntireItemToGsis !== "undefined" ? ProjectionType.ALL : ProjectionType.KEYS_ONLY,
        // readCapacity: 1,
        // writeCapacity: 1,
      })

      table.addGlobalSecondaryIndex({
        indexName: "meta__id",
        partitionKey: { name: "meta", type: AttributeType.STRING },
        sortKey: { name: "id", type: AttributeType.STRING },
        projectionType: !!props.copyEntireItemToGsis && props.copyEntireItemToGsis !== "undefined" ? ProjectionType.ALL : ProjectionType.KEYS_ONLY,
        // readCapacity: 1,
        // writeCapacity: 1,
      })

      return table;
    }

    const createTableV2 = (dataModel: DataModel) => {
      const table = new Table(this, clientAppName, {
        tableName: clientAppName,
        partitionKey: { name: "id", type: AttributeType.STRING },
        sortKey: { name: "meta", type: AttributeType.STRING },

        billingMode: BillingMode[aartsConfig.DynamoDB.Mode],
        readCapacity: aartsConfig.DynamoDB.ProvisionedCapacity && aartsConfig.DynamoDB.ProvisionedCapacity.RCU || undefined,
        writeCapacity: aartsConfig.DynamoDB.ProvisionedCapacity && aartsConfig.DynamoDB.ProvisionedCapacity.WCU || undefined,

        stream: StreamViewType.NEW_AND_OLD_IMAGES,
        removalPolicy: RemovalPolicy[aartsConfig.DynamoDB.RemovalPolicy] 
      })

      for (const gsi of dataModel.GSIs) {
        const pkName = gsi.substr(0, gsi.indexOf("__"))
        const pkType = pkName.startsWith("s") ? AttributeType.STRING : AttributeType.NUMBER
        const skName = gsi.substr(gsi.indexOf("__") + 2)
        const skType = skName.startsWith("s") ? AttributeType.STRING : AttributeType.NUMBER
        
        table.addGlobalSecondaryIndex({
          indexName: gsi,
          partitionKey: { name: pkName, type: pkType },
          sortKey: { name: skName, type: skType },
          projectionType: !!props.copyEntireItemToGsis && props.copyEntireItemToGsis !== "undefined" ? ProjectionType.ALL : ProjectionType.KEYS_ONLY,
        })
      }

      return table;
    }

    if (dataModel.version === 1) {
      this.table = createTableV1()
    }
    if (dataModel.version === 2) {
      this.table = createTableV2(dataModel)
    }
    
    // this.testTable =createTable(true) // do not use a test table in a provisioned mode, incures redundant costs.
  }

  public grantAccess = (func: Function) => {
    this.table.grantFullAccess(func);
    func.addEnvironment(ENV_VARS__DB_NAME, this.table.tableName);
    func.addEnvironment(ENV_VARS__DB_ENDPOINT, `only used when testing locally`);

    if (!!this.testTable) {
      this.testTable.grantFullAccess(func);
      func.addEnvironment(ENV_VARS__TEST_DB_NAME, this.testTable.tableName);
      func.addEnvironment(ENV_VARS__DB_ENDPOINT, `only used when testing locally`);
    }
  }
}