echo off

docker network create sam-local

docker run -ti --network sam-local --name dynamodb -d --restart always -v %~dp0dynamodblocaldata:/home/dynamodblocal/data/ -p 8000:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data/

rem  test its working
rem aws dynamodb list-tables --endpoint-url http://localhost:8000
rem  go to http://localhost:8000/shell
