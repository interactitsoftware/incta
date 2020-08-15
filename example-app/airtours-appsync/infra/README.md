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
- `aws dynamodb create-table --cli-input-json file://local-dev-table-def.json --endpoint-url http://localhost:8000`
### Test the Setup
- `run-lambda.sh inputHandler create-airplane` # this will run the lambda in a local aws lambda environment pointed to local dynamodb.

### Windows
- clone repo
- ensure docker file sharing for folder %AARTS_HOME% is added (from docker GUI) 
- `cd .\infra`
- `npm run build` or better see below:
- `sh buildandlink.sh` (__use git bash__) will build all npm packages and will update the example apps with them
- `./run-dynamodb-local.bat` 
  - This bring a local dynamo instance living inside a docker container
  - `http://localhost:8000/shell/` provides a UI + code snippets
- `aws dynamodb create-table --cli-input-json file://local-dev-table-def.json --endpoint-url http://localhost:8000`
  - This creates the needed table structure, inside the local dynamo instance

  ## Local DEV testing (NOTE that is when you finally run the code to inspect logs etc, this does not free you from first doing jest tests and overall TDD)
  - `export AWS_PROFILE='yourprofile'`
  - `cdk synth --profile $AWS_PROFILE` generates the corresponding cloud formation - needed for local lambda run
  - There are the 2 input lambdas `dispatcher` and `handler`. In AWS, AppSync will call dispatcher, which will drop a sqs message in the handler's queue. In local development the connection SNS-SQS is missing. We can test the dispatcher:
  - `.\run-lambda.bat dispatcher create` . This will call the SNS dispatcher lambda, passing it a payload from ./test-events/create.json. However it will not do much as noone will activate the sqs handler, which is what is actually triggering domain logic
  - `.\run-lambda.bat handler sqsHandler/create` . This will call the actual SQS hadler, this time with payload (in sqsHandler/create.json) that is a string representation of a JSON SQS event. Actual payload we pass is inside the `body` property. This makes it a bit hard to test, as instead of just configuring meaningful json props (as in test-events/create.json for dispatcher payloads), we need to deal with stringified representation, thus:
  - `aarts.bat create` - this will actually call the sqs handler, but with a payload that is intended for the dispatcher. I.e the tedios edit of a stringified json props is automated with the help `samLocalSimulateHandler.js`

# Actions/Pattern matching supported

## Create
- Creating one item below 1K results in 2 WCU 
- Creating a single item in a transaction
  - examinig ref keys
  - up to 23 ref keys allowed (even though creating an item with 23 ref keys will result in 24 and there is 1 more, when updating/deleting we have the item, the history and max 23 refs = 25)
  - Note that the `refkey` support affects WCU and ultimatley costs. Inserting one item with 3 refkeys, will result in 4 items in DB, thus 8 WCUs (because its transactional)

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

 