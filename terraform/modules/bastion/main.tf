resource "aws_security_group" "bastion" {
  name        = "${var.name}-bastion"
  description = "ShopLite bastion: ssh from the admin network only"
  vpc_id      = var.vpc_id
  tags        = { Name = "${var.name}-bastion" }
}

resource "aws_vpc_security_group_ingress_rule" "ssh_from_admin" {
  security_group_id = aws_security_group.bastion.id
  description       = "ssh from the admin network"
  cidr_ipv4         = var.admin_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "ssh_to_nodes" {
  security_group_id            = aws_security_group.bastion.id
  description                  = "ssh to the nodes only"
  referenced_security_group_id = var.node_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
}

resource "aws_vpc_security_group_ingress_rule" "nodes_ssh_from_bastion" {
  security_group_id            = var.node_security_group_id
  description                  = "ssh from the bastion only"
  referenced_security_group_id = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 22
  to_port                      = 22
}

resource "aws_instance" "bastion" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.public_subnet_id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  key_name                    = var.key_name
  tags                        = { Name = "${var.name}-bastion", role = "bastion" }

  metadata_options {
    http_tokens = "required"
  }

  root_block_device {
    volume_type = "gp3"
    encrypted   = true
  }
}
