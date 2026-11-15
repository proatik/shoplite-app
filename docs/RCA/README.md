# Root cause analysis: chaos day

| Field           | Value                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Date            | 14 November 2026                                                                                        |
| Environment     | prod (`shoplite` namespace)                                                                             |
| Load            | k6 at 25 requests per second for 15 minutes (product pages 15, catalogue 8, orders 2)                   |
| First alert     | `QueueBacklog` at 17:23 UTC; the queue was already growing before the fault (see Detection)             |
| Root cause      | `orderWorker.chaos.slowDb: true` (`CHAOS_SLOW_DB`): every order waits 2 s before each of its two writes |
| Time to detect  | 8 minutes to the first alert; the fault's own signal, order processing time, moved at 17:15             |
| Time to recover | 25 minutes, from the first alert (17:23) to `QueueBacklog` resolving (17:48)                            |

No peer was available, so `shoplite-gitops/scripts/chaos.sh` played the peer: it turned on one
random flag in `envs/prod/values.yaml` and committed it as `chore: tune prod settings`. The Git diff
and the pod environment stayed closed until Grafana showed the root cause below.

## 1. Timeline

All times are UTC, read from Grafana, Slack and Git (the lab clock showed UTC+6).

| Time  | Event                                                                                         |
| ----- | --------------------------------------------------------------------------------------------- |
| 17:07 | Baseline: queue empty, one worker replica, orders take 1–2 s                                  |
| 17:10 | Load test starts; the queue starts to grow                                                    |
| 17:15 | Chaos commit `17a4396` pushed and `shoplite-prod` synced; order processing time jumps to ~6 s |
| 17:23 | First alert: `QueueBacklog` fires in Slack                                                    |
| 17:23 | Investigation starts from the alert's runbook                                                 |
| 17:29 | Root cause identified: the trace of order 1668 shows two 2 s `SELECT pg_sleep` spans          |
| 17:41 | Revert `83ae817` pushed to `shoplite-gitops`                                                  |
| 17:44 | Argo CD syncs prod; processing time back to 1.5–2 s; the worker runs 3 replicas               |
| 17:48 | `QueueBacklog` resolves; the queue drains to 0                                                |

## 2. Detection

`QueueBacklog` fired first: `max by (namespace) (order_queue_depth) > 50` for 10 minutes.

- The load test sent 2 orders per second; 1–1.8 were created (the rest were out-of-stock 409s),
  while the worker completed only 0.16 per second, so the `orders:pending` queue grew past 50 and
  stayed there (402 waiting at 17:20, peak about 600).
- `HighLatency` and `HighErrorRate` stayed quiet: the API answered `/orders` in about 8 ms and the
  5xx rate was 0%. The fault therefore sat behind the queue, in the worker, not in the API.
- Contributing factor: before the fault one worker replica handled about 0.67 orders per second
  against the 2 the load test sends, so the queue grew from 17:10, and an earlier run fired
  `QueueBacklog` at 16:28 with no flag on.
- So the alert alone did not prove a fault. What set this incident apart was **Order processing
  time** jumping from 1.5–2 s to about 6 s at 17:15, the moment the fault reached prod; no alert
  watched that panel.

## 3. Investigation

Grafana only, following [the queue-backlog runbook](../../monitoring/runbooks/queue-backlog.md).

1. **Dashboard (ShopLite — Golden Signals):** **Order processing time** jumped at 17:15 from 1.5–2 s
   to p50 6.25 s and p99 7.48 s, while **Orders created vs processed** showed 1.05 created against
   0.16 completed per second. Worker replicas stayed at 1. API latency, errors, CPU and memory were
   flat, which ruled out `latencyMs`, `errorRate` and `memoryLeak`.
2. **Logs (Loki):** `{namespace="shoplite"}` showed `order processed` lines from `order-worker`
   about 5.5 s apart (orders 1638, 1639 and 1640 at 17:26:24, :29 and :35). A search for
   `(?i)error|failed|timeout` found no errors; its matches were `FAILED` orders, which are normal
   out-of-stock results. The worker was healthy but slow on every order.
3. **Trace (Tempo):** the trace of order 1668 (`8472fb4ab91b818eecbe59a33ee94ad6`) shows
   `POST /orders` at 17:16:28 taking 11 ms, then `order.process` starting only at 17:29:06, 12.6
   minutes later in the queue, and lasting 5.93 s. Inside it, each `UPDATE orders` is preceded by a
   `SELECT pg_sleep` span of exactly 2 s. Its **Related logs** link opened the matching log line for
   order 1668.

## 4. Root cause

The two 2 s `pg_sleep` spans before each database write are what `CHAOS_SLOW_DB` does
(`orderWorker.chaos.slowDb` in the prod values). It took each order from about 1.5 s to about 6 s,
cutting the single worker's throughput to about 0.17 orders per second while orders kept arriving at
1–2 per second. The chaos commit `17a4396`, opened only after the investigation, confirms it:
`slowDb: false` → `slowDb: true` in `envs/prod/values.yaml`.

## 5. Recovery

A `git revert` of `17a4396` was pushed as `83ae817` (`Revert "chore: tune prod settings"`) at 17:41,
and syncing `shoplite-prod` in Argo CD rolled the worker back to `CHAOS_SLOW_DB=false`. Order
processing time returned to 1.5–2 s, and from 17:44 the worker ran 3 replicas, which drained the
600-order queue to 0. `QueueBacklog` resolved at 17:48: **25 minutes from first alert to recovery**,
7 minutes from the revert.

## 6. Prevention

**A CI guard on prod values.** A pull request to `shoplite-gitops` that turns on any chaos flag in
`envs/prod/values.yaml` now fails the `Chaos guard` check
([chaos-guard.yaml](https://github.com/proatik/shoplite-gitops/blob/main/.github/workflows/chaos-guard.yaml)),
so an innocuous message such as `chore: tune prod settings` cannot hide a fault from review. The
guard covers pull requests only: making every prod change go through one would need branch
protection on `main`, which the chaos exercise itself bypasses by pushing directly.

Follow-up: the worker now runs four consumers per pod, about 2.7 orders per second
([shoplite-app PR #22](https://github.com/proatik/shoplite-app/pull/22)). The figures above describe
the single-consumer worker at the time of the incident.

## Evidence

The screenshots for each step are in the evidence pack, files `q8-00` to `q8-07`: the chaos run and
sync (`q8-00`), load test (`q8-01`), first alert (`q8-02`), dashboard (`q8-03`), logs (`q8-04`),
trace (`q8-05`), revert (`q8-06`) and recovery (`q8-07`).
