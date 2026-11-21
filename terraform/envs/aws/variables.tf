variable "region" {
  description = "AWS region to build in."
  type        = string
}

variable "environment" {
  description = "Environment tag on every resource."
  type        = string
  default     = "prod"
}

variable "name" {
  description = "Prefix for every resource name."
  type        = string
  default     = "shoplite"
}

variable "vpc_cidr" {
  description = "VPC address range."
  type        = string
  default     = "10.20.0.0/16"
}

variable "ssh_public_key" {
  description = "Public key installed for the ubuntu user, as text, so CI can plan without a key file."
  type        = string

  validation {
    condition     = can(regex("^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256) ", var.ssh_public_key))
    error_message = "ssh_public_key must be the text of an OpenSSH public key, such as ssh-ed25519 AAAA...."
  }
}

variable "ssh_private_key_path" {
  description = "Matching private key, written into the generated Ansible inventory."
  type        = string
}

variable "admin_access" {
  description = "How admins reach the private nodes: ssm (preferred, no open port) or bastion, for accounts whose policy blocks Session Manager sessions."
  type        = string
  default     = "ssm"

  validation {
    condition     = contains(["ssm", "bastion"], var.admin_access)
    error_message = "admin_access must be ssm or bastion."
  }
}

variable "admin_cidr" {
  description = "Only network allowed to ssh to the bastion; required when admin_access is bastion."
  type        = string
  default     = null

  validation {
    condition     = var.admin_access == "ssm" || can(cidrhost(var.admin_cidr, 0))
    error_message = "admin_cidr must be a CIDR such as 203.0.113.10/32 when admin_access is bastion."
  }
}

variable "control_plane_instance_type" {
  description = "Instance type of the control-plane node."
  type        = string
  default     = "t3.medium"
}

variable "worker_instance_type" {
  description = "Instance type of each worker node."
  type        = string
  default     = "t3.large"
}

variable "worker_count" {
  description = "Number of worker nodes."
  type        = number
  default     = 2
}

variable "root_volume_gb" {
  description = "Size of each encrypted root volume."
  type        = number
  default     = 30
}

variable "entry_points" {
  description = "Public ALB port and ingress NodePort per environment; prod keeps port 80 as the brief's ShopLite URL."
  type = map(object({
    listener_port = number
    node_port     = number
  }))
  default = {
    prod = { listener_port = 80, node_port = 30080 }
    dev  = { listener_port = 8080, node_port = 30081 }
  }

  validation {
    condition     = contains(keys(var.entry_points), "prod")
    error_message = "entry_points must include prod, whose NodePort also answers the health check."
  }
}

variable "github_oidc_subject" {
  description = "Subject prefix in shoplite-app's GitHub OIDC tokens. Immutable subjects carry the owner and repository ids; read it with: gh api repos/OWNER/REPO/actions/oidc/customization/sub."
  type        = string
  default     = "repo:proatik@57863827/shoplite-app@1455091856"
}

variable "create_github_oidc_provider" {
  description = "Create GitHub's OIDC provider; false when the account already has one."
  type        = bool
  default     = true
}

variable "enable_s3_backups" {
  description = "Create the backup bucket and let the nodes write to it. Turn off where S3 is not allowed; dumps then stay on the control plane."
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Days the backup bucket keeps each dump."
  type        = number
  default     = 30
}

variable "enable_sqs" {
  description = "Create the SQS queues, the order-confirmation Lambda and the EventBridge rule, and let the nodes use the queues. Redis stays the default queue."
  type        = bool
  default     = false
}

variable "budget_limit_usd" {
  description = "Monthly cost budget."
  type        = number
  default     = 20
}

variable "budget_email" {
  description = "Address that receives the budget alerts."
  type        = string

  validation {
    condition     = can(regex("^[^@ ]+@[^@ ]+\\.[^@ ]+$", var.budget_email))
    error_message = "budget_email must be an email address."
  }
}
