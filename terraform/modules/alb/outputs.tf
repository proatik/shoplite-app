output "dns_name" {
  description = "Public DNS name of the load balancer: the ShopLite URL."
  value       = aws_lb.this.dns_name
}

output "target_group_arns" {
  description = "Target group per entry point, for nodes registered by an Auto Scaling group."
  value       = { for name, group in aws_lb_target_group.ingress : name => group.arn }
}

output "security_group_id" {
  description = "Security group of the load balancer."
  value       = aws_security_group.alb.id
}
