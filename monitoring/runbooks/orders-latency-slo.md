# OrdersLatencyBudgetFastBurn · OrdersLatencyBudgetSlowBurn

|               |                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **SLO**       | 99% of `POST /orders` requests finish in under 500 ms, over 30 days: an error budget of 1%             |
| **Fast burn** | critical: over 14.4% of orders are slow in both the last hour and the last 5 minutes, for 2 minutes    |
| **Slow burn** | warning: over 6% of orders are slow in both the last 6 hours and the last 30 minutes, for 15 minutes   |
| **Impact**    | placing an order feels slow; fast burn spends the month's budget in about 2 days, slow burn in 5 days  |
| **Rules**     | [alert-rules/slo.yaml](../alert-rules/slo.yaml), recorded as `shoplite:orders_slow_ratio:rate<window>` |
| **Dashboard** | ShopLite — Golden Signals → **Latency p50 / p95 / p99 by route**, **CPU per pod**                      |

Each alert needs a long and a short window together: the long one proves the burn is real, the
short one that it is still happening, so the alert resolves soon after the cause is gone.

## 1. Confirm

1. Open the dashboard and set `namespace` to the one in the alert.
2. **Latency p50 / p95 / p99 by route** shows `/orders` p99 above 500 ms. Note the start time.
3. In Explore → Prometheus, the share of slow orders right now:
   ```promql
   shoplite:orders_slow_ratio:rate5m
   ```

## 2. Diagnose

1. Click an exemplar dot on the `/orders` line; it opens that exact request's trace in Tempo.
2. In the trace, find the span that takes the time:
   - `INSERT orders` or `SELECT products` is long: the database is slow;
   - `orders:pending publish` is long: Redis is slow;
   - the server span is long but its children are short: `catalog-api` is short of CPU.
3. To see more slow orders at once:
   ```traceql
   { resource.service.name = "catalog-api" && span.http.route = "/orders" && duration > 500ms }
   ```

| What you see                                      | Likely cause                                   | Next step                                                         |
| ------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| Database spans are slow on every route            | PostgreSQL is overloaded or short of resources | Check **CPU per pod** and **Memory per pod** for `postgres`       |
| The publish span is slow                          | Redis is overloaded or restarting              | `kubectl -n <namespace> get pods -l app.kubernetes.io/name=redis` |
| **CPU per pod** is at the limit for `catalog-api` | too little CPU for the load                    | Raise the CPU limit or replicas in the values, through Git        |
| Slow right after a deploy                         | a bad release                                  | Fix: undo the change                                              |

## 3. Fix through Git

Follow [Undo a bad change](README.md#undo-a-bad-change), or commit the corrected resources to the
environment's values.

## 4. Verify

- [ ] `/orders` p99 on the latency panel is back below 500 ms
- [ ] `shoplite:orders_slow_ratio:rate5m` is below 0.01
- [ ] the alert resolves (the short window clears within about 5 minutes for fast burn, 30 for slow)

## 5. After

Follow [After every incident](README.md#after-every-incident).
