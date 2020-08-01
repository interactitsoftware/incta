# TODO
- currently when query request come (action=query), as we do not want asynchronicity for such requests, we are calling synchronously __another lambda__ i.e we call the aartsHandler lambda to synchronously provide us with query results. Put efforts on saving the latency times for calling this separate lambda (have access to BaseItemManager also on dispatcher level?)
- env variables for sam local lambda endpoint and other props - always use same code, but depending on execution env to switch them
- [OK]fix local paths in samLocalSimulateSQSHandler
  