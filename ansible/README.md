# Ansible

Configures the ShopLite nodes after Terraform creates them. Run it from Linux
(WSL or the lab VM), never from native Windows.

## Roles

| Role       | What it enforces                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`     | daily automatic security updates (`unattended-upgrades`)                                                                                                                                                                                                                                                                                                                                        |
| `users`    | the `ops` group, the only one allowed to log in; a `deploy` user in `ops` with a locked password and exactly one key; passwordless sudo for `ops`, validated with `visudo`                                                                                                                                                                                                                      |
| `ssh`      | installs [`linux/sshd_config`](../linux/sshd_config): key-only logins, no root, no passwords, only `ops`; validated with `sshd -t` before the restart                                                                                                                                                                                                                                           |
| `logs`     | `/var/log/shoplite` owned by `root:ops`, mode `0750`, and one default ACL so `ops` can read every log file in it                                                                                                                                                                                                                                                                                |
| `firewall` | runs [`linux/firewall/ufw.sh`](../linux/firewall/ufw.sh): deny incoming; 22 from `admin_cidrs`; 80 and 443; cluster ports from the node network only                                                                                                                                                                                                                                            |
| `fail2ban` | bans an address after 5 failed ssh logins in 10 minutes, never the admin networks                                                                                                                                                                                                                                                                                                               |
| `k3s`      | installs the pinned k3s release after checking its sha256, with secrets encrypted at rest and without the bundled Traefik and metrics-server; agents join with a token read from the server at run time; fetches the kubeconfig to `~/.kube/shoplite.yaml`                                                                                                                                      |
| `backup`   | a `shoplite-backup` user with no shell runs [`linux/bin/shoplite-backup`](../linux/bin/shoplite-backup) nightly from the sandboxed [service and timer](../linux/systemd), keeps 7 days of dumps, copies each to S3 when a bucket is set, and logs to `/var/log/shoplite/backup.log`; `shoplite-restore` restores a dump into a scratch database. Its kubeconfig may only exec into `postgres-0` |

| Playbook                | Runs                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| `playbooks/site.yaml`   | `hardening.yaml` on every node, then `k3s.yaml` (server first, then the agents) |
| `playbooks/backup.yaml` | the backup role on the server, once the chart runs with `backup.enabled=true`   |

Terraform writes the AWS inventory to `inventories/aws/hosts.yaml`; Git ignores it.

## Tools

Pinned versions, installed per user with [uv](https://docs.astral.sh/uv/) (no
sudo; uv also brings its own Python where the system one is too old):

```bash
uv tool install ansible-core==2.21.6
uv tool install ansible-lint==26.10.1 --with ansible-core==2.21.6
ansible-galaxy collection install -r requirements.yaml
```

The local test also needs helm v4.3.1 on the path, to render the database part of the chart.

## Test locally

`test/run.sh` starts two Ubuntu 24.04 containers set up like fresh EC2 nodes
(systemd, ssh, iproute2, an `ubuntu` user with passwordless sudo), builds them
into a hardened k3s cluster, deploys PostgreSQL from the real chart, backs it
up, runs everything a second time and checks the result:

```bash
./test/run.sh
```

It fails unless the second run changes nothing and all 23 checks pass:

- `deploy` is in `ops`, logs in with its key and uses sudo; a valid key outside `ops` is refused;
  sshd refuses passwords and root and admits only `ops`
- `/var/log/shoplite` is `root:ops 750` with one default ACL; `ops` reads the backup log and an
  outsider cannot
- ufw denies by default, opens only 80 and 443 to anyone and 22 to the admin network; fail2ban
  watches sshd
- both k3s nodes are ready on the pinned version, secrets are encrypted at rest, the control plane
  takes no app pods, the bundled Traefik is absent, and the kubeconfig was fetched with mode 600
- the backup timer is scheduled, the service restarts on failure, writes a dump that restores with
  every row, and its account cannot read secrets

What containers cannot prove, the lab run must: kernel modules, EC2 metadata
and the S3 upload.

The test key lives in `~/.cache/shoplite-ansible/`, outside the repository.
Remove the containers with `docker compose -f test/compose.yaml down`.

When the repository sits on a Windows drive, WSL sees it as world-writable
and Ansible ignores `ansible.cfg` there; `test/run.sh` sets `ANSIBLE_CONFIG`
for that reason. Do the same when running playbooks by hand.
