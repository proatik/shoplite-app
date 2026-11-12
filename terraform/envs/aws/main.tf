data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

module "network" {
  source = "../../modules/network"
  name   = var.name
  cidr   = var.vpc_cidr
}

module "ecr" {
  source                      = "../../modules/ecr"
  name                        = var.name
  repositories                = ["web", "catalog-api", "order-worker"]
  keep_images                 = 20
  force_delete                = true
  github_oidc_subject         = var.github_oidc_subject
  create_github_oidc_provider = var.create_github_oidc_provider
}

module "backup_bucket" {
  source         = "../../modules/backup_bucket"
  count          = var.enable_s3_backups ? 1 : 0
  bucket_name    = "${var.name}-backups-${data.aws_caller_identity.current.account_id}"
  retention_days = var.backup_retention_days
  force_destroy  = true
}

module "alb" {
  source                 = "../../modules/alb"
  name                   = var.name
  vpc_id                 = module.network.vpc_id
  vpc_cidr               = module.network.vpc_cidr
  public_subnet_ids      = module.network.public_subnet_ids
  target_instance_ids    = { for name, worker in module.compute.workers : name => worker.id }
  entry_points           = var.entry_points
  health_check_node_port = var.entry_points["prod"].node_port
  health_check_path      = "/ping"
}

module "compute" {
  source                      = "../../modules/compute"
  name                        = var.name
  vpc_id                      = module.network.vpc_id
  vpc_cidr                    = module.network.vpc_cidr
  private_subnet_ids          = module.network.private_subnet_ids
  alb_security_group_id       = module.alb.security_group_id
  ingress_node_ports          = [for entry in values(var.entry_points) : entry.node_port]
  ssh_public_key              = var.ssh_public_key
  control_plane_instance_type = var.control_plane_instance_type
  worker_instance_type        = var.worker_instance_type
  worker_count                = var.worker_count
  root_volume_gb              = var.root_volume_gb
  ecr_repository_arns         = module.ecr.repository_arns
  backup_bucket_arn           = var.enable_s3_backups ? module.backup_bucket[0].bucket_arn : null
}

module "bastion" {
  source                 = "../../modules/bastion"
  count                  = var.admin_access == "bastion" ? 1 : 0
  name                   = var.name
  vpc_id                 = module.network.vpc_id
  public_subnet_id       = module.network.public_subnet_ids[0]
  admin_cidr             = var.admin_cidr
  node_security_group_id = module.compute.node_security_group_id
  ami_id                 = module.compute.ami_id
  key_name               = module.compute.key_name
  instance_type          = "t3.micro"
}

locals {
  bastion   = var.admin_access == "bastion" ? module.bastion[0] : null
  ssm_proxy = "aws ssm start-session --region ${var.region} --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p"
  ssh_proxy = local.bastion == null ? local.ssm_proxy : "ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=accept-new -W %h:%p ubuntu@${local.bastion.public_ip}"
  nodes     = merge({ control-plane = module.compute.control_plane }, module.compute.workers)
  ssh_host  = { for name, node in local.nodes : name => local.bastion == null ? node.id : node.private_ip }
}

# pull requests may only read: the plan job posts what an apply would change, and changes nothing.
data "aws_iam_policy_document" "ci_plan_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.ecr.github_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${var.github_oidc_subject}:pull_request"]
    }
  }
}

resource "aws_iam_role" "ci_plan" {
  name               = "${var.name}-ci-plan"
  assume_role_policy = data.aws_iam_policy_document.ci_plan_assume.json
}

resource "aws_iam_role_policy_attachment" "ci_plan" {
  role       = aws_iam_role.ci_plan.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_budgets_budget" "monthly" {
  name         = "${var.name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.budget_limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_email]
  }
}

resource "local_file" "inventory" {
  filename        = "${path.root}/../../../ansible/inventories/aws/hosts.yaml"
  file_permission = "0644"
  content = templatefile("${path.module}/inventory.yaml.tftpl", {
    ssh_proxy            = local.ssh_proxy
    ssh_host             = local.ssh_host
    admin_cidrs          = local.bastion == null ? [] : ["${local.bastion.private_ip}/32"]
    control_plane        = module.compute.control_plane
    workers              = module.compute.workers
    node_cidr            = module.network.vpc_cidr
    ingress_node_ports   = [for entry in values(var.entry_points) : entry.node_port]
    backup_bucket        = var.enable_s3_backups ? module.backup_bucket[0].bucket_name : ""
    ssh_private_key_path = var.ssh_private_key_path
  })
}
