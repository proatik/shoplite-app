data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

locals {
  k3s = var.cluster == "k3s"
  eks = var.cluster == "eks"
}

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

module "queue" {
  source            = "../../modules/queue"
  count             = var.enable_sqs ? 1 : 0
  name              = var.name
  lambda_source_dir = "${path.root}/../../../services/order-confirmation"
}

module "alb" {
  source                 = "../../modules/alb"
  name                   = var.name
  vpc_id                 = module.network.vpc_id
  vpc_cidr               = module.network.vpc_cidr
  public_subnet_ids      = module.network.public_subnet_ids
  target_instance_ids    = local.k3s ? { for name, worker in module.compute[0].workers : name => worker.id } : {}
  entry_points           = var.entry_points
  health_check_node_port = var.entry_points["prod"].node_port
  health_check_path      = "/ping"
}

module "compute" {
  source                      = "../../modules/compute"
  count                       = local.k3s ? 1 : 0
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

data "aws_iam_policy_document" "node_sqs" {
  count = var.enable_sqs && local.k3s ? 1 : 0

  statement {
    sid       = "UseOrdersQueue"
    actions   = ["sqs:SendMessage", "sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"]
    resources = [module.queue[0].orders_queue_arn]
  }

  statement {
    sid       = "SendOrderConfirmed"
    actions   = ["sqs:SendMessage", "sqs:GetQueueUrl"]
    resources = [module.queue[0].confirmed_queue_arn]
  }
}

resource "aws_iam_role_policy" "node_sqs" {
  count  = var.enable_sqs && local.k3s ? 1 : 0
  name   = "use-order-queues"
  role   = module.compute[0].node_role_name
  policy = data.aws_iam_policy_document.node_sqs[0].json
}

module "bastion" {
  source                 = "../../modules/bastion"
  count                  = local.k3s && var.admin_access == "bastion" ? 1 : 0
  name                   = var.name
  vpc_id                 = module.network.vpc_id
  public_subnet_id       = module.network.public_subnet_ids[0]
  admin_cidr             = var.admin_cidr
  node_security_group_id = module.compute[0].node_security_group_id
  ami_id                 = module.compute[0].ami_id
  key_name               = module.compute[0].key_name
  instance_type          = "t3.micro"
}

locals {
  bastion   = local.k3s && var.admin_access == "bastion" ? module.bastion[0] : null
  ssm_proxy = "aws ssm start-session --region ${var.region} --target %h --document-name AWS-StartSSHSession --parameters portNumber=%p"
  ssh_proxy = local.bastion == null ? local.ssm_proxy : "ssh -i ${var.ssh_private_key_path} -o StrictHostKeyChecking=accept-new -W %h:%p ubuntu@${local.bastion.public_ip}"
  nodes     = local.k3s ? merge({ control-plane = module.compute[0].control_plane }, module.compute[0].workers) : {}
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
  count           = local.k3s ? 1 : 0
  filename        = "${path.root}/../../../ansible/inventories/aws/hosts.yaml"
  file_permission = "0644"
  content = templatefile("${path.module}/inventory.yaml.tftpl", {
    ssh_proxy            = local.ssh_proxy
    ssh_host             = local.ssh_host
    admin_cidrs          = local.bastion == null ? [] : ["${local.bastion.private_ip}/32"]
    control_plane        = module.compute[0].control_plane
    workers              = module.compute[0].workers
    node_cidr            = module.network.vpc_cidr
    ingress_node_ports   = [for entry in values(var.entry_points) : entry.node_port]
    backup_bucket        = var.enable_s3_backups ? module.backup_bucket[0].bucket_name : ""
    ssh_private_key_path = var.ssh_private_key_path
  })
}

# the k3s resources gained a count for the eks option; these keep their state addresses.
moved {
  from = module.compute
  to   = module.compute[0]
}

moved {
  from = local_file.inventory
  to   = local_file.inventory[0]
}

# eks: the cluster, its managed nodes behind the same load balancer, and pod identity for the queues.

data "aws_iam_policy_document" "catalog_api_sqs" {
  count = var.enable_sqs && local.eks ? 1 : 0

  statement {
    sid       = "SendOrders"
    actions   = ["sqs:SendMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"]
    resources = [module.queue[0].orders_queue_arn]
  }
}

data "aws_iam_policy_document" "order_worker_sqs" {
  count = var.enable_sqs && local.eks ? 1 : 0

  statement {
    sid       = "ConsumeOrders"
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:GetQueueUrl"]
    resources = [module.queue[0].orders_queue_arn]
  }

  statement {
    sid       = "SendOrderConfirmed"
    actions   = ["sqs:SendMessage", "sqs:GetQueueUrl"]
    resources = [module.queue[0].confirmed_queue_arn]
  }
}

module "eks" {
  source                = "../../modules/eks"
  count                 = local.eks ? 1 : 0
  name                  = var.name
  kubernetes_version    = var.eks_kubernetes_version
  private_subnet_ids    = module.network.private_subnet_ids
  admin_cidr            = var.admin_cidr
  instance_type         = var.worker_instance_type
  node_count            = var.worker_count
  root_volume_gb        = var.root_volume_gb
  alb_security_group_id = module.alb.security_group_id
  ingress_node_ports    = [for entry in values(var.entry_points) : entry.node_port]

  # dev runs on sqs; prod keeps the redis list, so it needs no aws access.
  workload_policies = var.enable_sqs ? {
    dev-catalog-api = {
      namespace       = "shoplite-dev"
      service_account = "catalog-api"
      policy_json     = data.aws_iam_policy_document.catalog_api_sqs[0].json
    }
    dev-order-worker = {
      namespace       = "shoplite-dev"
      service_account = "order-worker"
      policy_json     = data.aws_iam_policy_document.order_worker_sqs[0].json
    }
  } : {}
}

resource "aws_autoscaling_attachment" "ingress" {
  for_each = local.eks ? module.alb.target_group_arns : {}

  autoscaling_group_name = module.eks[0].node_autoscaling_group_name
  lb_target_group_arn    = each.value
}
