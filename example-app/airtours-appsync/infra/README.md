# How to run

## Prerequisites
- [nodejs]
- [aws cli]
- [cdk cli]
- [sam cli](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install-linux.html)
- [dynamodb workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.html)
- [docker] with docker user added to sudoers group. To create the docker group and add your user:
  - Create the docker group. `$ sudo groupadd docker`
  - Add your user to the docker group. `$ sudo usermod -aG docker $USER`
  - Log out and log back in so that your group membership is re-evaluated. 
  - Verify that you can run docker commands without `sudo`

## Setting up local dev environment
###Linux
- clone repo
- `export $AARTS_HOME `#<path to repo>`
- `cd $AARTS_HOME/infra && chmod +x *.sh`
- `./run-build.sh` # if some projects in build fail, delete their package-lock.json and re run `run-build.sh`
- `./run-dynamodb-local.sh` 
- `./run-dynamodb-create-table.sh`
### Test the Setup
- `run-lambda.sh inputHandler create-samolet` # this will run the lambda in a local aws lambda environment pointed to local dynamodb.

### Windows
- clone repo
- ensure docker file sharing for folder %AARTS_HOME% is added (from docker GUI) 
- `cd .\infra`
- `npm run build`
- `./run-dynamodb-local.bat` 
- TODO aws cli cmd for create table
- There are the 2 input lambdas `dispatcher` and `handler`. In AWS AppSync will call dispatcher, which will drop a sqs message in the handler's queue. In local development the connection SNS-SQS is missing so what we can do is test directly the handler:
- 

### Test the Setup
- aarts test-single-samolet


# Actions/Pattern matching supported

## Create
- Creating one item below 1K results in 2 WCU 
- Creating a single item in a transaction
  - examinig ref keys
  - up to 23 ref keys allowed (even though creating an item with 23 ref keys will result in 24 and there is 1 more, when updating/deleting we have the item, the history and max 23 refs = 25)

Payload
{
    "action": "create",
    "item": "<the domain item to be created>",
    "arguments": {
      <domain specific keys>
    },
    "identity": {
      <domain specific info on principal>
    }
  }

## Update
        // // 1. Batch Get Items
        // // 2. Base validation - checking type and mandatory keys
        // // 3. Domain validation - if validate ok, proceed update in DB based on args
        // // 4. FAIL if some contains old revisions or lack such
        // // 5. IN A TRANSACTIONAL WRITE \
        // //     5.1 UPDATE RECORD, increasing the revisions
        // //     5.2 also update records for refkeys, if there are any
        // //     5.2 CREATE HISRTORY RECORD with the old values, that were updated
    // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html
- Updating 1 item 

## Get
Payload
{
    "action": "get",
    "item": "<irrelevant here, though needs to point to a valid domain item>",
    "arguments": {
      {"id":string}[]
    },
    "identity": {
      <domain specific info on principal>
    }
  }

## Query

{
    "action": "query",
    "item": "samolet",
    "arguments": {
      "pk": "v_0|samolet",
      "range": {"min": 10, "max":12},
      "ddbIndex": "meta__nmetadata",
      "filter": [{
        "key": "aaaa",
        "predicate": "=",
        "value": 555
      }],
      "limit": 2,
      "paginationToken": null
  },
    "identity": {
      "username": "akrsmv"
    }
  }

## Delete

## Start

 