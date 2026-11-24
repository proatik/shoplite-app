data "aws_partition" "current" {}

locals {
  managed_policy = "arn:${data.aws_partition.current.partition}:iam::aws:policy"
}

# control plane

data "aws_iam_policy_document" "cluster_assume" {
  statement {
    actions = ["sts:AssumeRole", "sts:TagSession"]
    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cluster" {
  name               = "${var.name}-eks-cluster"
  assume_role_policy = data.aws_iam_policy_document.cluster_assume.json
}

resource "aws_iam_role_policy_attachment" "cluster" {
  role       = aws_iam_role.cluster.name
  policy_arn = "${local.managed_policy}/AmazonEKSClusterPolicy"
}

# kubernetes secrets are encrypted with a key of this account, not only by the default disk encryption.
resource "aws_kms_key" "secrets" {
  description             = "${var.name} EKS secrets encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7
}

data "aws_iam_policy_document" "cluster_kms" {
  statement {
    sid       = "EncryptSecrets"
    actions   = ["kms:Encrypt", "kms:Decrypt", "kms:DescribeKey", "kms:ListGrants", "kms:CreateGrant"]
    resources = [aws_kms_key.secrets.arn]
  }
}

resource "aws_iam_role_policy" "cluster_kms" {
  name   = "encrypt-secrets"
  role   = aws_iam_role.cluster.id
  policy = data.aws_iam_policy_document.cluster_kms.json
}

# created before the cluster so that terraform also deletes it.
resource "aws_cloudwatch_log_group" "cluster" {
  name              = "/aws/eks/${var.name}/cluster"
  retention_in_days = 7
}

# kubectl runs from the lab vm, which has no route into the vpc; the endpoint answers only admin_cidr,
# a single admin address.
#trivy:ignore:AWS-0040
#trivy:ignore:AWS-0041
resource "aws_eks_cluster" "this" {
  name                      = var.name
  version                   = var.kubernetes_version
  role_arn                  = aws_iam_role.cluster.arn
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  access_config {
    authentication_mode                         = "API"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    subnet_ids              = var.private_subnet_ids
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = [var.admin_cidr]
  }

  encryption_config {
    resources = ["secrets"]
    provider {
      key_arn = aws_kms_key.secrets.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster,
    aws_iam_role_policy.cluster_kms,
    aws_cloudwatch_log_group.cluster,
  ]
}

# the load balancer reaches the ingress controller on the nodes, which share the cluster security group.
resource "aws_vpc_security_group_ingress_rule" "ingress_from_alb" {
  for_each = toset([for port in var.ingress_node_ports : tostring(port)])

  security_group_id            = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
  description                  = "ingress controller port ${each.key} from the ALB only"
  referenced_security_group_id = var.alb_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.key)
  to_port                      = tonumber(each.key)
}

# nodes

data "aws_iam_policy_document" "node_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${var.name}-eks-node"
  assume_role_policy = data.aws_iam_policy_document.node_assume.json
}

# the nodes pull the app images and the add-on images from AWS's own registries; no queue rights here.
resource "aws_iam_role_policy_attachment" "node" {
  for_each = toset(["AmazonEKSWorkerNodePolicy", "AmazonEKS_CNI_Policy", "AmazonEC2ContainerRegistryPullOnly"])

  role       = aws_iam_role.node.name
  policy_arn = "${local.managed_policy}/${each.value}"
}

resource "aws_eks_node_group" "this" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.name}-nodes"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.private_subnet_ids
  ami_type        = "AL2023_x86_64_STANDARD"
  instance_types  = [var.instance_type]
  disk_size       = var.root_volume_gb

  scaling_config {
    desired_size = var.node_count
    min_size     = var.node_count
    max_size     = var.node_count
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [aws_iam_role_policy_attachment.node]
}

# add-ons: networking with network policy enforcement, dns, pod identity and block storage.

resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"
  configuration_values        = jsonencode({ enableNetworkPolicy = "true" })
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "kube-proxy"
  resolve_conflicts_on_create = "OVERWRITE"
}

resource "aws_eks_addon" "pod_identity_agent" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "eks-pod-identity-agent"
  resolve_conflicts_on_create = "OVERWRITE"
}

resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "coredns"
  resolve_conflicts_on_create = "OVERWRITE"

  depends_on = [aws_eks_node_group.this]
}

data "aws_iam_policy_document" "pod_assume" {
  statement {
    actions = ["sts:AssumeRole", "sts:TagSession"]
    principals {
      type        = "Service"
      identifiers = ["pods.eks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ebs_csi" {
  name               = "${var.name}-ebs-csi"
  assume_role_policy = data.aws_iam_policy_document.pod_assume.json
}

resource "aws_iam_role_policy_attachment" "ebs_csi" {
  role       = aws_iam_role.ebs_csi.name
  policy_arn = "${local.managed_policy}/service-role/AmazonEBSCSIDriverPolicy"
}

resource "aws_eks_addon" "ebs_csi" {
  cluster_name                = aws_eks_cluster.this.name
  addon_name                  = "aws-ebs-csi-driver"
  resolve_conflicts_on_create = "OVERWRITE"

  pod_identity_association {
    role_arn        = aws_iam_role.ebs_csi.arn
    service_account = "ebs-csi-controller-sa"
  }

  depends_on = [aws_eks_node_group.this, aws_eks_addon.pod_identity_agent, aws_iam_role_policy_attachment.ebs_csi]
}

# workloads: each service account gets its own role, and only the actions it uses.

resource "aws_iam_role" "workload" {
  for_each = var.workload_policies

  name               = "${var.name}-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.pod_assume.json
}

resource "aws_iam_role_policy" "workload" {
  for_each = var.workload_policies

  name   = each.key
  role   = aws_iam_role.workload[each.key].id
  policy = each.value.policy_json
}

resource "aws_eks_pod_identity_association" "workload" {
  for_each = var.workload_policies

  cluster_name    = aws_eks_cluster.this.name
  namespace       = each.value.namespace
  service_account = each.value.service_account
  role_arn        = aws_iam_role.workload[each.key].arn

  depends_on = [aws_eks_addon.pod_identity_agent]
}
