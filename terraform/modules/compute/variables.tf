variable "name" {
  description = "Prefix for instance, role and security group names."
  type        = string
}

variable "vpc_id" {
  description = "VPC the nodes run in."
  type        = string
}

variable "vpc_cidr" {
  description = "VPC address range, which holds the DNS resolver."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets; workers spread across them."
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "The ALB's security group, the only source allowed to reach the ingress port."
  type        = string
}

variable "ingress_node_port" {
  description = "NodePort the ingress controller listens on for the ALB."
  type        = number
}

variable "ssh_public_key" {
  description = "Public key for the ubuntu user; ssh runs through SSM sessions or the bastion."
  type        = string
}

variable "control_plane_instance_type" {
  description = "Instance type of the control-plane node."
  type        = string
}

variable "worker_instance_type" {
  description = "Instance type of each worker node."
  type        = string
}

variable "worker_count" {
  description = "Number of worker nodes."
  type        = number
}

variable "root_volume_gb" {
  description = "Size of each encrypted root volume."
  type        = number
}

variable "ecr_repository_arns" {
  description = "Repositories the nodes may pull images from."
  type        = list(string)
}

variable "backup_bucket_arn" {
  description = "Bucket the nodes may write database dumps to, or null for none."
  type        = string
  default     = null
}
