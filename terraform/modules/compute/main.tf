data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

data "aws_partition" "current" {}

locals {
  nodes = merge(
    { control-plane = { type = var.control_plane_instance_type, subnet = var.private_subnet_ids[0] } },
    {
      for index in range(var.worker_count) : "worker-${index + 1}" => {
        type   = var.worker_instance_type
        subnet = var.private_subnet_ids[index % length(var.private_subnet_ids)]
      }
    }
  )
}

resource "aws_security_group" "nodes" {
  name        = "${var.name}-nodes"
  description = "ShopLite Kubernetes nodes: no inbound from the internet"
  vpc_id      = var.vpc_id
  tags        = { Name = "${var.name}-nodes" }
}

resource "aws_vpc_security_group_ingress_rule" "ingress_from_alb" {
  for_each = toset([for port in var.ingress_node_ports : tostring(port)])

  security_group_id            = aws_security_group.nodes.id
  description                  = "ingress controller port ${each.key} from the ALB only"
  referenced_security_group_id = var.alb_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.key)
  to_port                      = tonumber(each.key)
}

resource "aws_vpc_security_group_ingress_rule" "cluster" {
  for_each = {
    api     = { port = 6443, protocol = "tcp" }
    kubelet = { port = 10250, protocol = "tcp" }
    flannel = { port = 8472, protocol = "udp" }
    metrics = { port = 9100, protocol = "tcp" }
  }

  security_group_id            = aws_security_group.nodes.id
  description                  = "k3s ${each.key} between nodes"
  referenced_security_group_id = aws_security_group.nodes.id
  ip_protocol                  = each.value.protocol
  from_port                    = each.value.port
  to_port                      = each.value.port
}

# registries, package mirrors, github, ssm and s3 change addresses, so these four ports stay open to any.
#trivy:ignore:AWS-0104
resource "aws_vpc_security_group_egress_rule" "internet" {
  for_each = {
    https = { port = 443, protocol = "tcp", why = "images, packages, SSM, S3 and alerts through NAT" }
    http  = { port = 80, protocol = "tcp", why = "Ubuntu package mirrors through NAT" }
    git   = { port = 22, protocol = "tcp", why = "Argo CD reads the GitOps repository over SSH" }
    ntp   = { port = 123, protocol = "udp", why = "time sync" }
  }

  security_group_id = aws_security_group.nodes.id
  description       = "outbound ${each.key}: ${each.value.why}"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = each.value.protocol
  from_port         = each.value.port
  to_port           = each.value.port
}

resource "aws_vpc_security_group_egress_rule" "dns" {
  for_each = toset(["udp", "tcp"])

  security_group_id = aws_security_group.nodes.id
  description       = "dns to the VPC resolver"
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = each.key
  from_port         = 53
  to_port           = 53
}

resource "aws_vpc_security_group_egress_rule" "cluster" {
  security_group_id            = aws_security_group.nodes.id
  description                  = "any traffic to the other nodes"
  referenced_security_group_id = aws_security_group.nodes.id
  ip_protocol                  = "-1"
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "node" {
  name               = "${var.name}-node"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.node.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "node" {
  statement {
    sid       = "PullImagesToken"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid       = "PullImages"
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"]
    resources = var.ecr_repository_arns
  }

  dynamic "statement" {
    for_each = var.backup_bucket_arn == null ? [] : [var.backup_bucket_arn]
    content {
      sid       = "WriteDumps"
      actions   = ["s3:PutObject", "s3:GetObject"]
      resources = ["${statement.value}/postgres/*"]
    }
  }
}

resource "aws_iam_role_policy" "node" {
  name   = "pull-images-and-write-backups"
  role   = aws_iam_role.node.id
  policy = data.aws_iam_policy_document.node.json
}

resource "aws_iam_instance_profile" "node" {
  name = "${var.name}-node"
  role = aws_iam_role.node.name
}

resource "aws_key_pair" "admin" {
  key_name   = "${var.name}-admin"
  public_key = var.ssh_public_key
}

resource "aws_instance" "node" {
  for_each = local.nodes

  ami                         = data.aws_ami.ubuntu.id
  instance_type               = each.value.type
  subnet_id                   = each.value.subnet
  associate_public_ip_address = false
  vpc_security_group_ids      = [aws_security_group.nodes.id]
  key_name                    = aws_key_pair.admin.key_name
  iam_instance_profile        = aws_iam_instance_profile.node.name
  tags                        = { Name = "${var.name}-${each.key}", role = each.key == "control-plane" ? "control-plane" : "worker" }

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = var.root_volume_gb
    encrypted   = true
  }
}
