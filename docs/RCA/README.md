# Root cause analysis: chaos day

| Field           | Value                                  |
| --------------- | -------------------------------------- |
| Date            |                                        |
| Environment     | prod (`shoplite` namespace)            |
| Load            | 20+ requests per second for 15 minutes |
| First alert     |                                        |
| Root cause      |                                        |
| Time to detect  |                                        |
| Time to recover |                                        |

## 1. Timeline

All times in UTC, read from Grafana and Alertmanager.

| Time | Event                                 |
| ---- | ------------------------------------- |
|      | Load test starts                      |
|      | First alert fires                     |
|      | Investigation starts                  |
|      | Root cause identified                 |
|      | Revert committed to `shoplite-gitops` |
|      | Argo CD syncs prod                    |
|      | Signals back to normal                |

## 2. Detection

Which alert fired first, the expression behind it, and why this fault moved that signal.

## 3. Investigation

Followed with Grafana only, without the Git diff or the pod environment.

1. **Dashboard:** the Golden Signals panel that changed first, and what it showed.
2. **Logs:** the Loki query and the log lines that narrowed it down.
3. **Trace:** the Tempo trace, and the span where the time or the error sat.

## 4. Root cause

The flag the peer enabled, and how the evidence above points to it.

## 5. Recovery

The revert commit, the prod sync and the dashboard returning to normal, with the time from first
alert to recovery.

## 6. Prevention

One change that would stop this fault reaching prod, or catch it sooner.

## Evidence

The screenshots for each step are in the evidence pack, files `q8-01` to `q8-07`.
