data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

locals {
  function_name = "${var.name}-order-confirmation"
  # a message that fails this many receives moves to the dead-letter queue.
  max_receive_count = 5
  # long enough to process an order, and more than six times the Lambda timeout.
  visibility_timeout = 60
}

resource "aws_sqs_queue" "orders_dlq" {
  name                    = "${var.name}-orders-dlq"
  sqs_managed_sse_enabled = true
}

resource "aws_sqs_queue" "orders" {
  name                       = "${var.name}-orders"
  visibility_timeout_seconds = local.visibility_timeout
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.orders_dlq.arn
    maxReceiveCount     = local.max_receive_count
  })
}

resource "aws_sqs_queue" "confirmed_dlq" {
  name                    = "${var.name}-order-confirmed-dlq"
  sqs_managed_sse_enabled = true
}

resource "aws_sqs_queue" "confirmed" {
  name                       = "${var.name}-order-confirmed"
  visibility_timeout_seconds = local.visibility_timeout
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.confirmed_dlq.arn
    maxReceiveCount     = local.max_receive_count
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 7
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.function_name}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda" {
  statement {
    sid       = "ReadConfirmedQueue"
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
    resources = [aws_sqs_queue.confirmed.arn]
  }

  statement {
    sid       = "PutEventsOnDefaultBus"
    actions   = ["events:PutEvents"]
    resources = ["arn:${data.aws_partition.current.partition}:events:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:event-bus/default"]
  }

  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.lambda.arn}:*"]
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "read-confirmed-queue-and-put-events"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda.json
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.lambda_source_dir
  output_path = "${path.root}/.terraform/order-confirmation.zip"
  excludes    = ["README.md"]
}

resource "aws_lambda_function" "order_confirmation" {
  function_name    = local.function_name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  timeout          = 10
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  depends_on = [aws_cloudwatch_log_group.lambda, aws_iam_role_policy.lambda]
}

resource "aws_lambda_event_source_mapping" "confirmed" {
  event_source_arn        = aws_sqs_queue.confirmed.arn
  function_name           = aws_lambda_function.order_confirmation.arn
  batch_size              = 10
  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_cloudwatch_log_group" "events" {
  name              = "/aws/events/${var.name}-order-confirmed"
  retention_in_days = 7
}

data "aws_iam_policy_document" "events_to_logs" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.events.arn}:*"]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com", "delivery.logs.amazonaws.com"]
    }
  }
}

resource "aws_cloudwatch_log_resource_policy" "events" {
  policy_name     = "${var.name}-events-to-logs"
  policy_document = data.aws_iam_policy_document.events_to_logs.json
}

resource "aws_cloudwatch_event_rule" "order_confirmed" {
  name = "${var.name}-order-confirmed"

  event_pattern = jsonencode({
    source        = ["shoplite.orders"]
    "detail-type" = ["OrderConfirmed"]
  })
}

resource "aws_cloudwatch_event_target" "logs" {
  rule = aws_cloudwatch_event_rule.order_confirmed.name
  arn  = aws_cloudwatch_log_group.events.arn

  depends_on = [aws_cloudwatch_log_resource_policy.events]
}
