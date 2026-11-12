output "public_ip" {
  description = "Address the admin connects to."
  value       = aws_instance.bastion.public_ip
}

output "private_ip" {
  description = "Address the nodes see ssh coming from."
  value       = aws_instance.bastion.private_ip
}
