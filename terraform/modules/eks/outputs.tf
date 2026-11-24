output "cluster_name" {
  description = "Name of the EKS cluster."
  value       = aws_eks_cluster.this.name
}

output "node_autoscaling_group_name" {
  description = "Auto Scaling group of the managed nodes, for the load balancer targets."
  value       = aws_eks_node_group.this.resources[0].autoscaling_groups[0].name
}
