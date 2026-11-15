# QueueBacklog

|                |                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| **Severity**   | warning                                                                                                 |
| **Fires when** | more than 50 orders wait in the `orders:pending` list for 10 minutes                                    |
| **Impact**     | orders stay `PENDING` far longer than the usual 1–2 seconds; nothing is lost                            |
| **Dashboard**  | ShopLite — Golden Signals → **Order queue depth**, **Orders created vs processed**, **Worker replicas** |

## 1. Confirm

1. Open the dashboard and set `namespace` to the one in the alert.
2. **Order queue depth** is above 50. Note whether it still grows.

## 2. Diagnose

1. **Orders created vs processed**: when created stays above processed, the worker cannot keep up.
2. **Worker replicas**: each pod runs 4 consumers (about 2.7 orders/s); the HPA adds pods from 1 to 4 on CPU.
3. **Order processing time**: the normal time is 1–2 seconds per order.
4. Look at slow orders in Explore → Tempo:
   ```traceql
   { resource.service.name = "order-worker" && name = "order.process" && duration > 3s }
   ```
5. Read the worker's logs in Explore → Loki:
   ```logql
   {namespace="shoplite", app="order-worker"}
   ```

| What you see                                                                                      | Likely cause                                  | Next step                                                         |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------- |
| Processing time is 5–6 s; inside `order.process` there is a gap of about 2 s before each `UPDATE` | `CHAOS_SLOW_DB` is set for `order-worker`     | Fix: undo the change                                              |
| Worker memory climbs with every order, then the pod restarts                                      | `CHAOS_MEMORY_LEAK` is set for `order-worker` | See [PodCrashLooping](pod-crash-looping.md); fix: undo the change |
| **Worker replicas** at 0, or no `order processed` lines                                           | the worker is not running                     | `kubectl -n shoplite get deploy order-worker`                     |
| Loki shows `order queue read failed`                                                              | the worker cannot reach Redis                 | Check the Redis pod                                               |
| Created jumped while processing time is normal                                                    | a traffic spike                               | It drains on its own; watch the queue                             |

## 3. Fix through Git

Follow [Undo a bad change](README.md#undo-a-bad-change). A queued id is not lost while the worker
is down; the backlog drains once it runs again.

## 4. Verify

- [ ] **Order queue depth** falls back to zero
- [ ] **Order processing time** is back to 1–2 seconds
- [ ] the alert resolves

## 5. After

Follow [After every incident](README.md#after-every-incident).
