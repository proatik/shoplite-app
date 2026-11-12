# HighLatency

|                |                                                                                   |
| -------------- | --------------------------------------------------------------------------------- |
| **Severity**   | warning                                                                           |
| **Fires when** | the `catalog-api` p95 request latency is above 1 second for 5 minutes             |
| **Impact**     | pages load slowly; shoppers may give up                                           |
| **Dashboard**  | ShopLite — Golden Signals → **Latency p50 / p95 / p99 by route**, **CPU per pod** |

## 1. Confirm

1. Open the dashboard and set `namespace` to the one in the alert.
2. **Latency p50 / p95 / p99 by route** shows p95 above 1 second. Note the start time.

## 2. Diagnose

1. Find the slow `route`, and compare p50 with p95:
   - p50 normal and p95 high: only some requests are slow;
   - all three high: every request is slow.
2. Click an exemplar dot on the slow line; it opens that exact request's trace in Tempo.
3. In the trace, look at where the time goes:
   - a long server span whose `SELECT` child starts late: the wait happens before the database;
   - a long `SELECT` or `UPDATE` span: the database is slow.
4. To see more slow requests at once:
   ```traceql
   { resource.service.name = "catalog-api" && duration > 1s }
   ```

| What you see                                                                                          | Likely cause                                   | Next step                                                   |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| About 30% of `/products/:id` requests are slow, p50 normal, the `SELECT` span is fast but starts late | `CHAOS_LATENCY_MS` is set for `catalog-api`    | Fix: undo the change                                        |
| Database spans are slow on every route                                                                | PostgreSQL is overloaded or short of resources | Check **CPU per pod** and **Memory per pod** for `postgres` |
| **CPU per pod** is at the limit for `catalog-api`                                                     | too little CPU for the load                    | Raise the CPU limit or replicas in the values, through Git  |
| Slow right after a deploy                                                                             | a bad release                                  | Fix: undo the change                                        |

## 3. Fix through Git

Follow [Undo a bad change](README.md#undo-a-bad-change), or commit the corrected resources to the
environment's values.

## 4. Verify

- [ ] p95 on the latency panel is back below 1 second
- [ ] new exemplars point at fast traces
- [ ] the alert resolves (about 5 minutes after p95 drops)

## 5. After

Follow [After every incident](README.md#after-every-incident).
