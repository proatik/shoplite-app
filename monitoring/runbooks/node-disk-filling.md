# NodeDiskFilling

|                |                                                                    |
| -------------- | ------------------------------------------------------------------ |
| **Severity**   | warning                                                            |
| **Fires when** | a node filesystem is more than 85% full for 5 minutes              |
| **Impact**     | at 100% the node evicts pods and PostgreSQL stops accepting writes |
| **Dashboard**  | Node Exporter / Nodes (bundled with kube-prometheus-stack)         |

## 1. Confirm

1. The alert names the `instance` (node) and the `mountpoint`.
2. Open **Node Exporter / Nodes** for that instance and check the disk usage panel.

## 2. Diagnose

1. Find how fast the disk fills: a steady climb and a sudden jump have different causes.
2. Find the largest volumes in Explore → Prometheus:
   ```promql
   topk(5, kubelet_volume_stats_used_bytes)
   ```
3. Check whether one app suddenly writes far more logs than usual, in Explore → Loki:
   ```logql
   sum by (app) (count_over_time({namespace=~".+"}[10m]))
   ```

| What you see                                    | Likely cause                        | Next step                                  |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| The PostgreSQL volume grows steadily            | data growth                         | Plan a bigger volume or disk               |
| A Loki, Tempo or Prometheus volume is near full | retention is too long for the disk  | Lower the retention in `monitoring/values` |
| One app's log volume jumped                     | an error loop writing the same line | Follow that app's runbook                  |

## 3. Fix through Git

1. Short term: lower the retention in the matching file under `monitoring/values` and sync.
2. Long term: raise the root volume size in Terraform and apply it.

## 4. Verify

- [ ] disk usage on the node falls below 85%
- [ ] the alert resolves

## 5. After

Follow [After every incident](README.md#after-every-incident).
