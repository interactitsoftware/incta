# What is AARTS and what is its purpose
AARTS (Artifacts in AWS) aims to bootstrap developments in AWS serverless, combining AppSync, DynamoDB, Lambda, SNS, SQS.
Developers should start off from only thinking about the `items` within the specific domain context, expressing them in a simple json format, where they describe their **propertires**, and **relations**

## Example aarts.schema.json, or bounded context definition, if you like:

```
{
  "airport": {
    "airport_size": {
      "type": "number",
      "unique": true
    }
    "country": {
      "type": "string",
      "ref": "country"
    }
  }
  "country": {
    "name": {
      "type": "string",
      "unique": true
    }
    "currency": {
      "type": "string"
    }
  }
}
```

## Aarts out-of-box
Once an items schema is provided, aarts takes it from there and produces:
- plane objects for each item
- dynamoDB transactional CRUD operations
- GraphQL schema 
- GraphQL queries for each item
- a Manager object for each item, where developer can put
  - prior create validation logic
  - prior update validation logic
  - prior start validation logic (items can have start method, essentially making them procedures, that keep their execution state in Dynamo)

# How to use

The aarts-cli narrows the focus to only domain logic development, avoiding developer's attention to expand into thinking about aws infrastructure and deployments
- `npm i -g aarts-cli` **NOTE** make sure you install it globally (with -g flag) otherwise when using inside a project will enter infinite symlinking
- after installing you can:
  - `aarts deploy -i` will deploy current app, asking for AWS CFN stack name and AWS profile
  - `aarts deploy --debug-mode` will deploy in debug mode, printing way more messages, and also creating few more SQS queues where you can track messages
  - `aarts deploy` will deploy current app, using default profile and parent folder name for CFN stack name
  - `aarts --cache-clean` will remove the cdk.out folder where cdk stages deployment bundles
  - `aarts deploy --stack-name <custom name> --profile <custom profile>` will remove the cdk.out folder where cdk stages deployment bundles

#In the Works
- `aarts init-project` produces a skeleton project
- `aarts eject` ejects the aws infrastructure code into ./infra folder, for further manipulations.
