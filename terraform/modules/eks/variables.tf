variable "name" {
  description = "Cluster name and prefix for its resources."
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version of the control plane and the node group."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for the control plane interfaces and the nodes."
  type        = list(string)
}

variable "admin_cidr" {
  description = "The only address range allowed to reach the public API endpoint."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type of the managed nodes."
  type        = string
}

variable "node_count" {
  description = "Number of managed nodes."
  type        = number
}

variable "root_volume_gb" {
  description = "Root disk size of each node, in GB."
  type        = number
}

variable "alb_security_group_id" {
  description = "Security group of the load balancer that reaches the ingress NodePorts."
  type        = string
}

variable "ingress_node_ports" {
  description = "NodePorts of the ingress controller, opened to the load balancer only."
  type        = list(number)
}

variable "workload_policies" {
  description = "AWS permissions per Kubernetes service account, granted through EKS Pod Identity."
  type = map(object({
    namespace       = string
    service_account = string
    policy_json     = string
  }))
}
