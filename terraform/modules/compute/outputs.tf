output "control_plane" {
  description = "Instance id and private address of the control-plane node."
  value = {
    id         = aws_instance.node["control-plane"].id
    private_ip = aws_instance.node["control-plane"].private_ip
  }
}

output "workers" {
  description = "Instance id and private address of each worker, by name."
  value = {
    for name, node in aws_instance.node : name => {
      id         = node.id
      private_ip = node.private_ip
    } if name != "control-plane"
  }
}

output "node_security_group_id" {
  description = "Security group shared by every node."
  value       = aws_security_group.nodes.id
}

output "ami_id" {
  description = "Ubuntu image every node runs."
  value       = data.aws_ami.ubuntu.id
}

output "node_role_name" {
  description = "IAM role every node runs as."
  value       = aws_iam_role.node.name
}

output "key_name" {
  description = "EC2 key pair installed for the ubuntu user."
  value       = aws_key_pair.admin.key_name
}
