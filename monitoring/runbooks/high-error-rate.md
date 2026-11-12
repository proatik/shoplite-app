# HighErrorRate

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| **Severity**   | critical                                                                |
| **Fires when** | more than 5% of `catalog-api` requests return a 5xx for 5 minutes       |
| **Impact**     | shoppers see errors; when it is `POST /orders`, orders are not placed   |
| **Dashboard**  | ShopLite — Golden Signals → **5xx error rate**, **Requests per second** |

## 1. Confirm

1. Open the dashboard and set `namespace` to the one in the alert.
2. **5xx error rate** is above 5%. Note when it started; that is the first line of the timeline.

## 2. Diagnose

1. **5xx error rate** shows which `route` fails; `/orders` and `/products/:id` behave differently.
2. In Explore → Tempo, find the failing requests:
   ```traceql
   { resource.service.name = "catalog-api" && status = error }
   ```
3. Open one trace and compare it with the table below.
4. In Explore → Loki, check whether the api logged anything:
   ```logql
   {namespace="shoplite", app="catalog-api", level="error"}
   ```

| What you see                                                                                                         | Likely cause                                         | Next step                                                |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Only `POST /orders` fails; each failing trace is one short error span with no child spans; Loki shows no error lines | `CHAOS_ERROR_RATE` is set for `catalog-api`          | Fix: undo the change                                     |
| Failing traces have a database or Redis child span in error; Loki shows `redis connection error` or a database error | PostgreSQL or Redis is down or unreachable           | Check the datastore pods: `kubectl -n shoplite get pods` |
| `POST /orders` fails with `order could not be queued` in Loki                                                        | Redis rejects the push; the order is marked `FAILED` | Check the Redis pod and its logs                         |
| Errors began right after a deploy, on many routes                                                                    | a bad release                                        | Fix: undo the change                                     |

## 3. Fix through Git

1. Follow [Undo a bad change](README.md#undo-a-bad-change) for the commit that introduced the fault.
2. For a datastore that is down, find out why from its pod events and logs before changing anything.

## 4. Verify

- [ ] **5xx error rate** is back to zero
- [ ] a new order through the shop reaches `COMPLETED`
- [ ] the alert resolves (about 5 minutes after the ratio drops)

## 5. After

Follow [After every incident](README.md#after-every-incident).
