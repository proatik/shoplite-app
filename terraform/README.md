# Terraform

Builds the AWS side of ShopLite as the brief's target architecture asks:

```text
Internet ──► ALB :80 (prod), :8080 (dev) ──► ingress NodePorts 30080, 30081 on the workers
                                           │
private subnets, no public addresses ──────┤
 ├─ control plane (k3s server)
 ├─ worker-1 (zone a)
 └─ worker-2 (zone b)
NAT gateway ──► outbound only · admin access through AWS SSM (default) or a bastion (the lab)
ECR: web, catalog-api, order-worker · GitHub Actions pushes through OIDC
```

## Layout

| Path                    | Builds                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `state/`                | the S3 bucket for Terraform state, kept in local state because a lab account lasts one session                                           |
| `envs/aws/`             | everything below, the read-only CI plan role, a USD 20 budget alarm and the generated Ansible inventory                                  |
| `modules/network`       | VPC over two availability zones, two public and two private subnets, internet gateway, NAT gateway                                       |
| `modules/compute`       | control plane and workers in the private subnets, their security group, and a node role for SSM, pulling from ECR and writing backups    |
| `modules/alb`           | the public ALB with one listener and target group per environment (prod on 80, dev on 8080), each checking `/ping` on the prod NodePort  |
| `modules/ecr`           | one repository per image (immutable tags, scan on push, lifecycle) and the GitHub OIDC role that may push only to them, only from `main` |
| `modules/backup_bucket` | the bucket for database dumps                                                                                                            |
| `modules/bastion`       | only with `admin_access = "bastion"`: one small host in a public subnet, SSH from `admin_cidr` only, forwarding SSH to the nodes only    |

Every resource carries `project=shoplite` through the provider's default tags.

## Run

```bash
# 1. the state bucket
cd terraform/state
terraform init && terraform apply -var region=<region>

# 2. everything else
cd ../envs/aws
terraform init -backend-config=bucket=<state bucket> -backend-config=region=<region>
terraform apply \
  -var region=<region> \
  -var budget_email=<you@example.com> \
  -var ssh_public_key="$(cat ~/.ssh/shoplite.pub)" \
  -var ssh_private_key_path=~/.ssh/shoplite

# 3. turn on the ECR publish and the pull-request plan in CI for this session
terraform output -raw github_variables | gh variable set -R proatik/shoplite-app -f -
```

State locking uses S3's native lock file (`use_lockfile`), so no DynamoDB table is needed.
`apply` writes `ansible/inventories/aws/hosts.yaml` (ignored by Git), which reaches every node by
instance id through an SSM session, or by private address through the bastion. Run
`terraform destroy` with the same variables when the session ends, and delete the GitHub
variables, which would otherwise point CI at an account that no longer exists:

```bash
for name in AWS_REGION AWS_ROLE_ARN AWS_PLAN_ROLE_ARN TF_STATE_BUCKET TF_SSH_PUBLIC_KEY \
  TF_SSH_PRIVATE_KEY_PATH TF_BUDGET_EMAIL TF_ADMIN_ACCESS TF_ADMIN_CIDR; do
  gh variable delete "$name" -R proatik/shoplite-app
done
```

With the variables gone, CI skips publishing and planning again.

## CI

Every change under `terraform/` runs the **Terraform checks and plan** job:

| Check                                     | Fails the job when                                                  |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `terraform fmt -check -recursive`         | a file is not formatted                                             |
| `terraform validate` on both roots        | the configuration is invalid                                        |
| `tflint --recursive` with the AWS ruleset | a rule fails, such as an invalid instance type                      |
| `trivy config` (HIGH and CRITICAL)        | a misconfiguration is found that is not accepted below              |
| `terraform plan` (pull requests only)     | the plan errors; it runs as `shoplite-ci-plan`, which may only read |

On a pull request the job posts one comment with these results and the plan, and updates it on
each push. The plan needs a live account, so it runs only while the variables from step 3 are set.

## Switches for restricted accounts

| Variable                                              | Default                 | Change it when                                                                                            |
| ----------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `enable_s3_backups`                                   | `true`                  | S3 is not allowed: no backup bucket; dumps stay on the control plane                                      |
| `create_github_oidc_provider`                         | `true`                  | the account already has GitHub's OIDC provider                                                            |
| `worker_instance_type`, `control_plane_instance_type` | `t3.large`, `t3.medium` | the account limits instance types                                                                         |
| `admin_access`, `admin_cidr`                          | `ssm`, none             | the account denies Session Manager sessions (`ssmmessages`): `bastion` and the admin's address as a `/32` |

If the state bucket cannot be created, keep state locally for that session:

```bash
cat > envs/aws/backend_override.tf <<'EOF'
terraform {
  backend "local" {}
}
EOF
terraform -chdir=envs/aws init
```

Terraform merges `*_override.tf` files over the configuration, so the local backend replaces S3
without changing tracked code. The state file then lives only on the machine that ran it: run
`destroy` before the session ends.

## Security

- Nodes have no public addresses and no inbound rule from the internet. The only inbound traffic
  is the ingress NodePort from the ALB's security group and the k3s ports between nodes. With the
  default `admin_access = "ssm"` there is no SSH port: administration goes through SSM sessions.
  The lab account blocks SSM sessions, so the lab uses `admin_access = "bastion"`: the nodes
  accept SSH from the bastion's security group only, and the bastion from `admin_cidr` only. The
  brief prefers SSM, so the bastion is a fallback, not the default.
- Instances require IMDSv2 and have encrypted root volumes.
- ECR repositories are immutable and scanned on push. CI has two roles, both through OIDC with no
  stored keys: `shoplite-ci-push` may push only to these repositories and only from `main`;
  `shoplite-ci-plan` may only read, and only from this repository's pull requests.
- Buckets block all public access, deny non-TLS requests, keep versions and encrypt at rest.

Trivy findings that stay on purpose, each ignored inline above its resource with the reason:

| Finding                              | Why it stays                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| AWS-0053 public load balancer        | the brief requires a public ALB as the only way in                                                       |
| AWS-0054 HTTP listener               | HTTPS on an ALB needs an ACM certificate, which needs a domain; the brief makes the domain optional      |
| AWS-0104 egress to `0.0.0.0/0`       | limited to 443, 80, 22 and 123/udp through NAT; registries, mirrors, GitHub, SSM and S3 change addresses |
| AWS-0132 no customer-managed KMS key | buckets use SSE-S3 (AES-256); a customer key needs KMS permissions the lab account may not grant         |
