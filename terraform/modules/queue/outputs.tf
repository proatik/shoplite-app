output "orders_queue_url" {
  description = "URL of the orders queue."
  value       = aws_sqs_queue.orders.url
}

output "orders_queue_arn" {
  description = "ARN of the orders queue."
  value       = aws_sqs_queue.orders.arn
}

output "confirmed_queue_url" {
  description = "URL of the order-confirmed queue."
  value       = aws_sqs_queue.confirmed.url
}

output "confirmed_queue_arn" {
  description = "ARN of the order-confirmed queue."
  value       = aws_sqs_queue.confirmed.arn
}
