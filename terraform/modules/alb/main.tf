resource "aws_security_group" "alb" {
  name        = "${var.name}-alb"
  description = "ShopLite public load balancer"
  vpc_id      = var.vpc_id
  tags        = { Name = "${var.name}-alb" }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  for_each = var.entry_points

  security_group_id = aws_security_group.alb.id
  description       = "http for ${each.key} from the internet"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = each.value.listener_port
  to_port           = each.value.listener_port
}

resource "aws_vpc_security_group_egress_rule" "targets" {
  for_each = var.entry_points

  security_group_id = aws_security_group.alb.id
  description       = "to the ${each.key} ingress port on the nodes"
  cidr_ipv4         = var.vpc_cidr
  ip_protocol       = "tcp"
  from_port         = each.value.node_port
  to_port           = each.value.node_port
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

# every entry point is served by the same ingress controller, so all of them check its health port.
resource "aws_lb_target_group" "ingress" {
  for_each = var.entry_points

  name     = "${var.name}-${each.key}"
  vpc_id   = var.vpc_id
  port     = each.value.node_port
  protocol = "HTTP"

  health_check {
    port                = tostring(var.health_check_node_port)
    path                = var.health_check_path
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_target_group_attachment" "ingress" {
  for_each = {
    for pair in setproduct(keys(var.entry_points), keys(var.target_instance_ids)) :
    "${pair[0]}-${pair[1]}" => { entry_point = pair[0], instance = pair[1] }
  }

  target_group_arn = aws_lb_target_group.ingress[each.value.entry_point].arn
  target_id        = var.target_instance_ids[each.value.instance]
  port             = var.entry_points[each.value.entry_point].node_port
}

# https needs an acm certificate, which needs a domain; the brief makes the domain optional.
#trivy:ignore:AWS-0054
resource "aws_lb_listener" "http" {
  for_each = var.entry_points

  load_balancer_arn = aws_lb.this.arn
  port              = each.value.listener_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ingress[each.key].arn
  }
}
