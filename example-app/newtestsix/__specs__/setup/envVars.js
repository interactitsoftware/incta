process.env.AWS_SAM_LOCAL="1"
process.env.DB_NAME="TEST1"
// process.env.CopyEntireItemToGSIs="1" // needs further work around creating the test data base on each test run, to respect this value
// process.env.DEBUGGER="1" //may print lots of logs
process.env.DDB_LOCAL_URL="http://localhost:8000"
// no need to exists in aws, its just the format really. From here the code deduce the region
process.env.EVENT_BUS_TOPIC="arn:aws:sns:eu-west-1:216788398771:airtours-EventsBus45DE4339-1SL08CMA81PYM"
