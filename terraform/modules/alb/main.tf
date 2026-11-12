resource "aws_security_group" "alb" {
  name        = "${var.name}-alb"
  description = "ShopLite public load balancer"
  vpc_id      = var.vpc_id
  tags        = { Name = "${var.name}-alb" }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.alb.id
  description       = "http from the internet"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_egress_rule" "targets" {
  security_group_id = aws_security_group.alb.id
  description       = "to the ingress port on the nodes"
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = "tcp"
  from_port         = var.target_port
  to_port           = var.target_port
}

# the brief requires a public alb as the only way in from the internet.
#trivy:ignore:AWS-0053
resource "aws_lb" "this" {
  name                       = var.name
  load_balancer_type         = "application"
  internal                   = false
  subnets                    = var.public_subnet_ids
  security_groups            = [aws_security_group.alb.id]
  drop_invalid_header_fields = true
}

resource "aws_lb_target_group" "ingress" {
  name     = "${var.name}-ingress"
  vpc_id   = var.vpc_id
  port     = var.target_port
  protocol = "HTTP"

  health_check {
    path                = var.health_check_path
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group_attachment" "ingress" {
  for_each = var.target_instance_ids

  target_group_arn = aws_lb_target_group.ingress.arn
  target_id        = each.value
  port             = var.target_port
}

# https needs an acm certificate, which needs a domain; the brief makes the domain optional.
#trivy:ignore:AWS-0054
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ingress.arn
  }
}
