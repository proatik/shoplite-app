variable "name" {
  description = "Name of the load balancer and prefix for its resources."
  type        = string
}

variable "vpc_id" {
  description = "VPC of the load balancer."
  type        = string
}

variable "vpc_cidr" {
  description = "VPC address range the load balancer forwards into."
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnets in two availability zones."
  type        = list(string)
}

variable "target_instance_ids" {
  description = "Nodes that run the ingress controller, by name."
  type        = map(string)
}

variable "target_port" {
  description = "NodePort of the ingress controller."
  type        = number
}

variable "health_check_path" {
  description = "Path the ingress controller answers 200 on."
  type        = string
}
