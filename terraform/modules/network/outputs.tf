output "vpc_id" {
  description = "VPC id."
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "VPC address range."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnets, one per availability zone, for the ALB and the NAT gateway."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnets, one per availability zone, for the Kubernetes nodes."
  value       = aws_subnet.private[*].id
}
