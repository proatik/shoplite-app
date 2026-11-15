# Linux

The configuration every ShopLite node runs. Ansible installs these files unchanged (see
[`ansible/`](../ansible/README.md)), so what is here is exactly what runs on the servers. On a single
Ubuntu server, the same files can be installed by hand.

| Brief                | File                                 | What it does                                                                                             |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 3.1 users and SSH    | [`sshd_config`](sshd_config)         | key-only logins, no root, no passwords, only the `ops` group; the `users` role creates `deploy` in `ops` |
| 3.2 file permissions | the `logs` role                      | `/var/log/shoplite`: `chown root:ops`, `chmod 0750`, one `setfacl -d -m g:ops:rX`                        |
| 3.3 backup service   | [`systemd/`](systemd), [`bin/`](bin) | nightly `pg_dump` to `/var/backups/shoplite/` at 02:00, `Restart=on-failure`                             |
| 3.4 firewall         | [`firewall/ufw.sh`](firewall/ufw.sh) | deny incoming by default; 22 from the admin network, 80 and 443 from anywhere                            |
| evidence             | [`evidence/`](evidence)              | command output and screenshots from the lab                                                              |

## Why the log directory is not 777

Mode `777` lets every local user read, change and delete the logs, so any compromised process could
hide its tracks; `0750` with one ACL gives exactly `ops` read access and nobody else.

## Firewall on the k3s nodes

Beyond 22, 80 and 443, the nodes also open the cluster ports (6443, 10250, 8472/udp, 9100 and the
ingress NodePorts 30080 for prod and 30081 for dev) to the private node network only, so nothing else is reachable from outside the
VPC. On a single server, set only `ADMIN_CIDRS`:

```bash
sudo ADMIN_CIDRS=203.0.113.10/32 ./firewall/ufw.sh
```

## Commands used for the evidence

Keep a second SSH session open while changing SSH or the firewall.

| Brief | Run                                                                                          | Shows                                             |
| ----- | -------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 3.1   | `ssh root@<node>` and `ssh -o PubkeyAuthentication=no deploy@<node>`                         | both refused                                      |
| 3.1   | `id deploy`                                                                                  | `deploy` is in `ops`                              |
| 3.2   | `ls -ld /var/log/shoplite` and `getfacl /var/log/shoplite`                                   | `root ops drwxr-x---` and `default:group:ops:r-x` |
| 3.3   | `systemctl status shoplite-backup.service` and `systemctl list-timers shoplite-backup.timer` | the last run and the next nightly run             |
| 3.4   | `sudo ss -tulpn` and `sudo ufw status verbose`                                               | listening ports and the rules                     |
| 3.4   | from another machine: `nc -zv <node> 443` and `nc -zv -w 3 <node> 5432`                      | one open, one blocked                             |
