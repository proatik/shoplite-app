# order-confirmation

AWS Lambda behind the optional SQS bonus (see `terraform/README.md`). It reads batches from the
`shoplite-order-confirmed` queue and puts one `OrderConfirmed` event per message on the default
EventBridge bus (source `shoplite.orders`, detail = the message body: `order_id`, `status`,
`completed_at`).

A record that cannot be published is reported through a partial batch response, so only that
message returns to the queue and, after five tries, moves to the dead-letter queue. One JSON line is
logged per event.

Terraform packages `index.mjs` as it is: the Node.js 22 runtime already provides
`@aws-sdk/client-eventbridge`, so there is nothing to install or bundle.
