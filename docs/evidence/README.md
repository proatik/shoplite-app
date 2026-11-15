# Evidence

Screenshots for every checkpoint, in the order of the brief. The Linux screenshots for Question 3 are in [linux/evidence](../../linux/evidence/README.md).

## Q1 · Build the Application

### API contract

Products, a 404, an order created with 201 and its status.

![API contract](images/q1-01-api-endpoints.png)

### Health and readiness

Liveness and readiness responses.

![Health and readiness](images/q1-02-health-ready.png)

### Unit tests

The API test suite passing.

![Unit tests](images/q1-03-unit-tests.png)

### JSON logs

Log lines with every required field, including trace_id.

![JSON logs](images/q1-04-json-logs.png)

### Graceful shutdown

The worker stops cleanly on SIGTERM.

![Graceful shutdown](images/q1-05-graceful-shutdown.png)

### Web app

Listing products, placing an order and following its status.

![Web app](images/q1-06-web-order.png)

## Q2 · Containerization with Docker

### Checkpoint: make up && make smoke on a clean machine

The stack starts and the smoke test reaches COMPLETED.

![Checkpoint: make up && make smoke on a clean machine](images/q2-01-make-up-smoke.png)

### Image sizes

All three images under 150 MB.

![Image sizes](images/q2-02-image-sizes.png)

### Healthy stack

All five containers healthy.

![Healthy stack](images/q2-03-compose-healthy.png)

### Non-root containers

Each service runs as an unprivileged user.

![Non-root containers](images/q2-04-non-root.png)

## Q4 · AWS Infrastructure as Code

### Terraform apply

Apply complete with its outputs.

![Terraform apply](images/q4-01-terraform-apply.png)

### VPC and subnets

Two public and two private subnets across two AZs.

![VPC and subnets](images/q4-02-vpc-subnets.png)

### Internet gateway

Attached and available.

![Internet gateway](images/q4-02b-igw.png)

### NAT gateway

Available in a public subnet for the private nodes.

![NAT gateway](images/q4-02c-nat.png)

### Security groups

Least-privilege rules.

![Security groups](images/q4-03-security-groups.png)

### Private nodes

Three instances with no public IP.

![Private nodes](images/q4-04-private-nodes.png)

### ALB targets

Healthy targets on the ingress NodePort.

![ALB targets](images/q4-05-alb-targets.png)

### ECR repositories

All three images pushed by CI.

![ECR repositories](images/q4-06-ecr-repositories.png)

### Remote state with locking

The state file in S3 and its lock.

![Remote state with locking](images/q4-07-remote-state.png)

### State locking

backend s3 with use_lockfile and encrypt.

![State locking](images/q4-07b-state-locking.png)

### Tags and budget

project=shoplite on resources and the USD 20 budget alarm.

![Tags and budget](images/q4-08-tags-budget.png)

### Tags in code

default_tags puts project=shoplite on every resource.

![Tags in code](images/q4-08b-tags.png)

### Tags on live resources

Every EC2 resource type carries project=shoplite.

![Tags on live resources](images/q4-08c-live-tags.png)

### Ansible run

Every host failed=0; a second run shows no changes.

![Ansible run](images/q4-09-ansible-recap.png)

### Ansible is idempotent

A second run reports changed=0 on every host.

![Ansible is idempotent](images/q4-09b-ansible-rerun.png)

### Cluster ready

One control plane and two workers Ready.

![Cluster ready](images/q4-10-cluster-nodes.png)

## Q5 · Kubernetes Deployment

### Checkpoint: an order placed through the ALB reaches COMPLETED

The order placed in the browser shows COMPLETED.

![Checkpoint: an order placed through the ALB reaches COMPLETED](images/q5-01-browser-order-completed.png)

### Prod catalogue

The shop through the ALB on port 80.

![Prod catalogue](images/q5-01a-prod-catalogue.png)

### Prod order processing

The same order mid-way, before COMPLETED.

![Prod order processing](images/q5-01b-prod-order-processing.png)

### Workloads

Deployments, StatefulSet, HPA, PDB and Ingress.

![Workloads](images/q5-02-workloads.png)

### NetworkPolicies

Only the API and the worker reach the data stores.

![NetworkPolicies](images/q5-03-network-policies.png)

### Who may reach the data stores

Only catalog-api and order-worker reach postgres and redis.

![Who may reach the data stores](images/q5-03b-data-from-backend.png)

### Non-root and resource limits

Every container runs as a non-root user, with limits.

![Non-root and resource limits](images/q5-04-non-root-limits.png)

### Secret and ConfigMap

Credentials in a Secret, settings in a ConfigMap.

![Secret and ConfigMap](images/q5-05-secret-configmap.png)

### HPA under load

The worker scales out.

![HPA under load](images/q5-06-hpa-scaling.png)

### k6 load summary

18,004 requests at 25 per second, every check passed.

![k6 load summary](images/q5-06b-k6-load-summary.png)

### Ingress controller

Traefik behind the ALB.

![Ingress controller](images/q5-07-traefik-ingress.png)

## Q6 · Observability

### Golden Signals dashboard under load

All required panels with live traffic.

![Golden Signals dashboard under load](images/q6-01-golden-signals.png)

### Stack running

Every monitoring pod up and ready.

![Stack running](images/q6-02-monitoring-pods.png)

### Scrape targets up

node-exporter, kube-state-metrics and the app. Captured on 16 Nov, in a later lab session that rebuilt the stack from the same repositories.

![Scrape targets up](images/q6-03-prometheus-targets.png)

### The six application metrics

Raw output of the /metrics endpoint.

![The six application metrics](images/q6-04-app-metrics.png)

### Worker metrics

orders_processed_total by result and order_processing_seconds.

![Worker metrics](images/q6-04b-worker-metrics.png)

### Logs in Loki

JSON fields parsed into labels.

![Logs in Loki](images/q6-05-loki-json-logs.png)

### One order, one trace

API → queue → worker → database in Tempo.

![One order, one trace](images/q6-06-order-trace.png)

### Finding order traces

TraceQL search for POST /orders.

![Finding order traces](images/q6-06a-order-trace-search.png)

### Worker span

Consumer of orders:pending on redis, order.result completed.

![Worker span](images/q6-06b-worker-span-details.png)

### Exemplar → trace

From a latency point on the dashboard straight to its trace.

![Exemplar → trace](images/q6-07-exemplar-to-trace.png)

### Exemplar opened

The exemplar lands on its exact trace.

![Exemplar opened](images/q6-07b-exemplar-trace-opened.png)

### Trace → logs

The logs of the same request, by trace_id.

![Trace → logs](images/q6-08-trace-to-logs.png)

### Five alert rules

Severity labels and runbook links.

![Five alert rules](images/q6-09-alert-rules.png)

### Alert rules in Grafana

The rule groups as Grafana lists them.

![Alert rules in Grafana](images/q6-09b-alert-rules-ui.png)

### Notification in Slack

Alertmanager message with its runbook link.

![Notification in Slack](images/q6-10-slack-alert.png)

### Built-in alert lifecycle

TargetDown fired and resolved while dev started.

![Built-in alert lifecycle](images/q6-10b-slack-targetdown.png)

### QueueBacklog resolved

The alert cleared once the queue drained.

![QueueBacklog resolved](images/q6-10c-slack-resolved.png)

## Q7 · CI/CD & GitOps

### Pipeline running

The CI graph mid-run: jobs that a change affects run, the rest are skipped.

![Pipeline running](images/q7-01-pipeline-running.png)

### Pipeline completed

Every job green on main, ending with the release to dev.

![Pipeline completed](images/q7-02-main-pipeline.png)

### Trivy gate

Scan step that fails on CRITICAL. Captured after the session from the same CI run, #34.

![Trivy gate](images/q7-03-trivy-gate.png)

### OIDC push to ECR

Assumes the role with no stored keys. Captured after the session from the same CI run, #34.

![OIDC push to ECR](images/q7-04-oidc-ecr-push.png)

### Image tag committed to GitOps

The bot commit in shoplite-gitops.

![Image tag committed to GitOps](images/q7-05-gitops-commit.png)

### Pull-request pipeline

Lint, tests, builds and scans on a PR.

![Pull-request pipeline](images/q7-06-pr-pipeline.png)

### Terraform plan as a PR comment

The plan posted on a pull request that changes terraform/.

![Terraform plan as a PR comment](images/q7-07-terraform-plan-comment.png)

### Opening the plan pull request

make tfpr pushes a branch and opens PR 21.

![Opening the plan pull request](images/q7-07a-make-tfpr.png)

### Plan pull request

PR 21 ready, checks green.

![Plan pull request](images/q7-07b-pr-overview.png)

### Argo CD Applications

Dev automatic, prod manual.

![Argo CD Applications](images/q7-08-argocd-applications.png)

### Self-healing

A manual kubectl edit reverted by Argo CD.

![Self-healing](images/q7-09-self-heal.png)

### Checkpoint: page title change reaches the browser

Commit → pipeline → Argo CD → browser, with no manual deploy command.

![Checkpoint: page title change reaches the browser](images/q7-10-title-checkpoint.png)

## Q8 · Chaos Day & Root Cause Analysis

### Clean start

The queue at 0 before the exercise.

![Clean start](images/q8-00a-queue-drained.png)

### Fault planted

One flag enabled in prod values, unseen.

![Fault planted](images/q8-00b-make-chaos.png)

### Prod refreshed

Argo CD re-reads Git.

![Prod refreshed](images/q8-00c-prod-refresh.png)

### Prod synced

The faulty values reach prod.

![Prod synced](images/q8-00d-prod-sync.png)

### Load test

15 minutes at 20 or more requests per second.

![Load test](images/q8-01-load-test.png)

### First alert

Which alert fired, and when.

![First alert](images/q8-02-first-alert.png)

### Dashboard

The panel that showed the fault.

![Dashboard](images/q8-03-dashboard.png)

### Logs

The failing requests in Loki.

![Logs](images/q8-04-logs.png)

### More logs

Loki during the incident.

![More logs](images/q8-04b-logs.png)

### Trace

The slow or failing span in Tempo.

![Trace](images/q8-05-trace.png)

### Trace detail

A slow order under the fault.

![Trace detail](images/q8-05a-trace.png)

### Trace to logs

The slow order's logs by trace_id, with two pg_sleep spans.

![Trace to logs](images/q8-05b-trace-to-logs.png)

### Further investigation

Grafana Explore during the incident.

![Further investigation](images/q8-05c-explore.png)

### Recovery through Git

The revert commit and the Argo CD sync.

![Recovery through Git](images/q8-06-revert-commit.png)

### The fault in Git

The innocuous "tune prod settings" commit.

![The fault in Git](images/q8-06a-chaos-commit.png)

### Revert on GitHub

The revert commit in shoplite-gitops.

![Revert on GitHub](images/q8-06b-revert-github.png)

### Prod synced after revert

Argo CD applies the fix.

![Prod synced after revert](images/q8-06c-prod-sync-after-revert.png)

### Recovery on the dashboard

The signals returning to normal after the revert.

![Recovery on the dashboard](images/q8-07-recovery-dashboard.png)

### Recovery in progress

The signals returning to normal.

![Recovery in progress](images/q8-07a-recovery-dashboard.png)

### Alert resolved

QueueBacklog cleared after recovery.

![Alert resolved](images/q8-07b-slack-resolved.png)
