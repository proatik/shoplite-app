# Runbooks

One runbook per alert, written before the incident, so whoever is on call can find the cause
and recover without guessing. Every alert links to its runbook through `runbook_url`, and every
runbook starts from the **ShopLite — Golden Signals** dashboard in Grafana.

## How to use a runbook

1. Open the runbook link in the alert notification.
2. Read the summary table: what fired, what shoppers feel, where to look first.
3. Work through the numbered steps in order: **Confirm**, **Diagnose**, **Fix**, **Verify**, **After**.
4. Write down the time of each step; it becomes the timeline of the RCA.

## Alerts

| Alert                       | Severity | What it means                                                 | Runbook                                        |
| --------------------------- | -------- | ------------------------------------------------------------- | ---------------------------------------------- |
| HighErrorRate               | critical | over 5% of api requests fail with a 5xx for 5 minutes         | [high-error-rate.md](high-error-rate.md)       |
| HighLatency                 | warning  | the api p95 latency is above 1 second for 5 minutes           | [high-latency.md](high-latency.md)             |
| QueueBacklog                | warning  | over 50 orders wait in the queue for 10 minutes               | [queue-backlog.md](queue-backlog.md)           |
| PodCrashLooping             | critical | a container restarted in the last 10 minutes                  | [pod-crash-looping.md](pod-crash-looping.md)   |
| NodeDiskFilling             | warning  | a node filesystem is over 85% full                            | [node-disk-filling.md](node-disk-filling.md)   |
| OrdersLatencyBudgetFastBurn | critical | `POST /orders` spends its 500 ms SLO budget 14 times too fast | [orders-latency-slo.md](orders-latency-slo.md) |
| OrdersLatencyBudgetSlowBurn | warning  | `POST /orders` spends its 500 ms SLO budget 6 times too fast  | [orders-latency-slo.md](orders-latency-slo.md) |

## Ground rules

| Do                                                                     | Don't                                                                         |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Fix by committing to `shoplite-gitops` and letting Argo CD sync        | `kubectl edit`, `scale` or `patch`: Argo CD reverts it and nothing records it |
| Undo a bad change with `git revert` of its commit                      | Force-push or rewrite history in either repository                            |
| Follow one request across signals: panel → exemplar or trace → logs    | Decide from a single signal                                                   |
| Use `kubectl` only to look: `get`, `describe`, `logs`, `top`, `events` | Delete a PersistentVolumeClaim: it holds the database                         |

During the chaos exercise, diagnose with Grafana alone (Prometheus, Loki and Tempo); the Git diff
and pod environment stay closed until the RCA is written.

## How an order moves

1. `POST /orders` saves the order as `PENDING` and pushes its id onto the Redis list `orders:pending`.
2. `order-worker` pops the id, claims the order (`PROCESSING`), waits 1–2 seconds, then takes the
   stock and sets `COMPLETED`, or `FAILED` when the stock is short, in one transaction.
3. The trace context travels inside the queue message, so the api and the worker spans of one order
   form a single trace.

## Queries used in every runbook

Replace `shoplite` with the namespace named in the alert.

```promql
# error ratio, p95 latency and queue depth, as the alerts compute them
sum by (namespace) (rate(http_requests_total{status=~"5.."}[5m])) / sum by (namespace) (rate(http_requests_total[5m]))
histogram_quantile(0.95, sum by (namespace, le) (rate(http_request_duration_seconds_bucket[5m])))
max by (namespace) (order_queue_depth)
```

```logql
# log labels: namespace, app, pod, container, level; trace_id links each line to its trace
{namespace="shoplite", app="catalog-api", level="error"}
{namespace="shoplite", app="order-worker"} |= "order processed"
```

```traceql
{ resource.service.name = "catalog-api" && status = error }
{ resource.service.name = "catalog-api" && duration > 1s }
{ resource.service.name = "order-worker" && name = "order.process" && duration > 3s }
```

## Undo a bad change

1. In `shoplite-gitops`, list the recent changes to the environment:
   `git log --oneline -10 -- envs/<env>/values.yaml`.
2. `git revert <commit>` and push.
3. Dev syncs on its own; for prod, sync its Application in Argo CD (prod syncs manually).
4. Wait until the Application shows **Synced** and **Healthy**.

## After every incident

1. Confirm the alert shows as resolved in the notification channel.
2. Write the RCA in `docs/RCA` from your timeline: detection, investigation, root cause,
   recovery time and one preventive measure.
3. If this runbook sent you the wrong way or missed a step, fix it in the same change.
