variable "name" {
  description = "Prefix for every resource name."
  type        = string
}

variable "vpc_id" {
  description = "VPC of the bastion."
  type        = string
}

variable "public_subnet_id" {
  description = "Public subnet the bastion runs in."
  type        = string
}

variable "admin_cidr" {
  description = "Only network allowed to ssh to the bastion."
  type        = string
}

variable "node_security_group_id" {
  description = "Security group of the nodes the bastion forwards ssh to."
  type        = string
}

variable "ami_id" {
  description = "Image of the bastion, the same Ubuntu release as the nodes."
  type        = string
}

variable "key_name" {
  description = "EC2 key pair for the ubuntu user."
  type        = string
}

variable "instance_type" {
  description = "Instance type of the bastion."
  type        = string
}
