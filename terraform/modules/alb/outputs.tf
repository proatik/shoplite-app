output "dns_name" {
  description = "Public DNS name of the load balancer: the ShopLite URL."
  value       = aws_lb.this.dns_name
}

output "security_group_id" {
  description = "Security group of the load balancer."
  value       = aws_security_group.alb.id
}
