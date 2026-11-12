variable "name" {
  description = "Prefix for every network resource name."
  type        = string
}

variable "cidr" {
  description = "VPC address range; public subnets take the first /24s, private ones start at .10."
  type        = string
}
