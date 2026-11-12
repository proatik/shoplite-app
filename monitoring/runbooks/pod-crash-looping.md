# PodCrashLooping

|                |                                                                            |
| -------------- | -------------------------------------------------------------------------- |
| **Severity**   | critical                                                                   |
| **Fires when** | a container in a `shoplite` namespace restarted within the last 10 minutes |
| **Impact**     | fewer healthy replicas; a restarting worker slows every order              |
| **Dashboard**  | ShopLite — Golden Signals → **Memory per pod**, **CPU per pod**            |

## 1. Confirm

1. The alert names the `namespace`, `pod` and `container`.
2. Open the dashboard with that namespace and find the pod on **Memory per pod**.

## 2. Diagnose

1. **Memory per pod**: a line that climbs to the limit and then drops is a container killed for
   running out of memory.
2. **CPU per pod**: check whether the pod was busy just before the restart.
3. Read the container's last lines before each restart in Explore → Loki:
   ```logql
   {namespace="shoplite", pod="<pod>"}
   ```
   An `error` line followed by a fresh start means the process crashed; no error at all means it
   was killed from outside.

| What you see                                                                                            | Likely cause                                  | Next step            |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------- |
| `order-worker` memory rises with every order, reaches its limit, then drops back                        | `CHAOS_MEMORY_LEAK` is set for `order-worker` | Fix: undo the change |
| Logs end with `catalog-api failed to start` or `order-worker failed to start` and a configuration error | a wrong value in the environment's values     | Fix: undo the change |
| Restarts began right after a deploy                                                                     | a bad release                                 | Fix: undo the change |

A PostgreSQL or Redis outage does not restart the app containers: they stay running and turn
unready, which shows as [HighErrorRate](high-error-rate.md). A `catalog-api` pod stuck in
`Init` is its `db-init` init container waiting for the database; this alert does not count
init containers.

## 3. Fix through Git

Follow [Undo a bad change](README.md#undo-a-bad-change). To look without changing anything:
`kubectl -n shoplite describe pod <pod>` shows the last termination reason, such as `OOMKilled`.

## 4. Verify

- [ ] **Memory per pod** stays flat under traffic
- [ ] no new restarts for 10 minutes, after which the alert resolves

## 5. After

Follow [After every incident](README.md#after-every-incident).
