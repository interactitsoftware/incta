##Local dev environment

- `aarts start-local-dynamodb` will start your local DB instance. It will create also two tables TEST1 and TEST2. TEST1 is used when running jest tests. TEST2 is used when you execute some commands/queries/ or domain CRUD via sam local cli.

- `aarts start-local-lambda` will invoke sam local start-lambda, setting up your application, the same way as if you deploy it to AWS. 

- `aarts process [-d] --test-event <test-event>` will call your application's controller with a specific payload. All possible payloads as per your domain-model.json are already templatized in __test_events folder by `aarts-cli rebuild-model` 