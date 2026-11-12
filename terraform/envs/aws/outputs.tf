output "url" {
  description = "ShopLite through the public ALB."
  value       = "http://${module.alb.dns_name}"
}

output "control_plane_id" {
  description = "Instance id of the control plane."
  value       = module.compute.control_plane.id
}

output "control_plane_ssh_host" {
  description = "Host ssh connects to for the control plane: its instance id through SSM, or its private address through the bastion."
  value       = local.ssh_host["control-plane"]
}

output "ssh_proxy" {
  description = "ProxyCommand that carries ssh to the private nodes."
  value       = local.ssh_proxy
}

output "bastion_ip" {
  description = "Public address of the bastion, or null when admin access is through SSM."
  value       = local.bastion == null ? null : local.bastion.public_ip
}

output "workers" {
  description = "Instance id and private address of each worker."
  value       = module.compute.workers
}

output "ecr_repositories" {
  description = "Image repository URL per application."
  value       = module.ecr.repository_urls
}

output "ci_role_arn" {
  description = "Role GitHub Actions assumes through OIDC to push images from main."
  value       = module.ecr.ci_role_arn
}

output "ci_plan_role_arn" {
  description = "Read-only role GitHub Actions assumes through OIDC to plan on pull requests."
  value       = aws_iam_role.ci_plan.arn
}

# none of these are secrets; set them for this session with:
#   terraform output -raw github_variables | gh variable set -R <owner/repo> -f -
output "github_variables" {
  description = "Repository variables that turn on the ECR publish and the pull-request plan in CI."
  value = join("\n", [for name, value in {
    AWS_REGION              = var.region
    AWS_ROLE_ARN            = module.ecr.ci_role_arn
    AWS_PLAN_ROLE_ARN       = aws_iam_role.ci_plan.arn
    TF_STATE_BUCKET         = "shoplite-tfstate-${data.aws_caller_identity.current.account_id}"
    TF_SSH_PUBLIC_KEY       = var.ssh_public_key
    TF_SSH_PRIVATE_KEY_PATH = var.ssh_private_key_path
    TF_BUDGET_EMAIL         = var.budget_email
    TF_ADMIN_ACCESS         = var.admin_access
    TF_ADMIN_CIDR           = var.admin_cidr == null ? "" : var.admin_cidr
  } : "${name}=\"${value}\""])
}

output "backup_bucket" {
  description = "Bucket that holds the database dumps, or null when S3 backups are off."
  value       = var.enable_s3_backups ? module.backup_bucket[0].bucket_name : null
}

output "inventory" {
  description = "Ansible inventory generated from this state."
  value       = local_file.inventory.filename
}
