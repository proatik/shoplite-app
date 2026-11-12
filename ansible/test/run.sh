#!/usr/bin/env bash
# Builds two throwaway systemd nodes into a hardened k3s cluster with a backed-up database, twice, then checks the outcome.
set -euo pipefail

cd "$(dirname "$0")/.."
export ANSIBLE_CONFIG="$PWD/ansible.cfg"
key=~/.cache/shoplite-ansible/id_ed25519
compose=(docker compose -f test/compose.yaml)

mkdir -p "$(dirname "$key")"
[ -f "$key" ] || ssh-keygen -q -t ed25519 -N '' -C shoplite-ansible-test -f "$key"

"${compose[@]}" up -d --build
for node in server agent; do
  "${compose[@]}" exec -T "$node" sh -c 'until systemctl is-active -q ssh; do sleep 1; done
    install -d -m 0700 -o ubuntu -g ubuntu /home/ubuntu/.ssh
    install -m 0600 -o ubuntu -g ubuntu /dev/stdin /home/ubuntu/.ssh/authorized_keys' < "$key.pub"
done

ansible-galaxy collection install -r requirements.yaml >/dev/null
ansible-playbook -i inventories/test playbooks/site.yaml

# only the database and its backup account: the app images are not available inside the test.
kube() { "${compose[@]}" exec -T server k3s kubectl "$@"; }
kube create namespace shoplite --dry-run=client -o yaml | kube apply -f - >/dev/null
kube -n shoplite create secret generic shoplite-db --from-literal=password="$(openssl rand -hex 16)" \
  --dry-run=client -o yaml | kube apply -f - >/dev/null
helm template shoplite ../helm/shoplite -n shoplite --set image.tag=test --set backup.enabled=true \
  --show-only templates/postgres.yaml --show-only templates/backup.yaml | kube -n shoplite apply -f - >/dev/null
kube -n shoplite wait --for=condition=Ready pod/postgres-0 --timeout=300s >/dev/null
# a k3s restart from the playbook can hide the pod for a few seconds, so the first exec retries.
for attempt in $(seq 1 30); do
  kube -n shoplite exec postgres-0 -- psql -U shoplite -d shoplite -qc \
    'CREATE TABLE IF NOT EXISTS backup_check AS SELECT generate_series(1, 42) AS n' >/dev/null && break
  [ "$attempt" = 30 ] && { echo 'FAIL: postgres-0 never accepted the test table'; exit 1; }
  sleep 2
done

ansible-playbook -i inventories/test playbooks/backup.yaml

second=$(ansible-playbook -i inventories/test playbooks/site.yaml playbooks/backup.yaml)
echo "$second" | tail -4
if echo "$second" | grep -E '^(server|agent) ' | grep -vq 'changed=0'; then
  echo 'FAIL: the second run changed something'; exit 1
fi

failed=0
check() {
  if eval "$2" >/dev/null 2>&1; then echo "PASS: $1"; else echo "FAIL: $1"; failed=1; fi
}
ssh_to() { ssh -i "$key" -p "$1" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o BatchMode=yes "${@:2}"; }
on_server() { "${compose[@]}" exec -T server "$@"; }

on_server sh -c 'id intruder >/dev/null 2>&1 || useradd -m intruder
  install -d -m 0700 -o intruder -g intruder /home/intruder/.ssh
  install -m 0600 -o intruder -g intruder /dev/stdin /home/intruder/.ssh/authorized_keys' < "$key.pub"
effective() { ssh_to 2201 deploy@127.0.0.1 sudo sshd -T | grep -qx "$1"; }

check 'deploy is in ops, logs in with its key and can sudo' "ssh_to 2201 deploy@127.0.0.1 'id -nG | grep -qw ops && sudo -n true'"
check 'a valid key outside ops is refused' "! ssh_to 2201 intruder@127.0.0.1 true"
check 'sshd refuses passwords' "effective 'passwordauthentication no' && effective 'kbdinteractiveauthentication no'"
check 'sshd refuses root' "effective 'permitrootlogin no'"
check 'sshd admits only ops' "effective 'allowgroups ops'"
check '/var/log/shoplite is root:ops 750' "[ \"\$(on_server stat -c '%U:%G %a' /var/log/shoplite)\" = 'root:ops 750' ]"
check '/var/log/shoplite has one default acl for ops' "on_server getfacl -p /var/log/shoplite | grep -qx 'default:group:ops:r-x'"
check 'ufw is active and denies by default' "on_server ufw status verbose | grep -q 'Default: deny (incoming)'"
check 'only 80 and 443 are open to anyone; 22 only to the admin network' "[ \"\$(on_server ufw status | awk '\$2 == \"ALLOW\" && \$3 == \"Anywhere\" {print \$1}' | sort | tr '\n' ' ')\" = '443/tcp 80/tcp ' ]"
check 'fail2ban watches sshd' "on_server fail2ban-client status sshd"
check 'both k3s nodes are ready' "[ \$(kube get nodes --no-headers | grep -c ' Ready ') = 2 ]"
check 'the pinned k3s version runs' "kube get nodes -o wide | grep -q 'v1.37.2+k3s1'"
check 'secrets are encrypted at rest' "on_server k3s secrets-encrypt status | grep -q 'Encryption Status: Enabled'"
check 'the control plane takes no application pods' "kube get node shoplite-server -o jsonpath={.spec.taints[*].key} | grep -q control-plane"
check 'the bundled traefik is not installed' "! kube get deploy -A | grep -q traefik"
check 'the kubelets pull from private ecr through the credential provider' "[ \$(for node in server agent; do \"\${compose[@]}\" exec -T \$node sh -c 'journalctl -u k3s -u k3s-agent --no-pager | grep -c image-credential-provider-config=/var/lib/rancher/credentialprovider/config.yaml'; done | grep -vc '^0\$') = 2 ]"
check 'the kubeconfig was fetched for the owner only' "[ \"\$(stat -c %a ~/.cache/shoplite-ansible/kubeconfig)\" = 600 ]"

as_backup() { on_server sudo -u shoplite-backup env KUBECONFIG=/var/lib/shoplite-backup/kubeconfig "$@"; }
on_server systemctl start shoplite-backup.service
dump=$(on_server sh -c 'ls -t /var/backups/shoplite/shoplite-*.dump | head -1')

check 'the backup timer is scheduled' "on_server systemctl is-active -q shoplite-backup.timer"
check 'the backup service restarts on failure' "[ \"\$(on_server systemctl show -p Restart --value shoplite-backup.service)\" = on-failure ]"
check 'the backup service wrote a dump' "on_server test -s '$dump'"
check 'ops can read the backup log' "ssh_to 2201 deploy@127.0.0.1 grep -q 'backup written' /var/log/shoplite/backup.log"
check 'a user outside ops cannot read the backup log' "! on_server sudo -u intruder cat /var/log/shoplite/backup.log"
check 'the dump restores with every row' "as_backup shoplite-restore '$dump' >/dev/null && [ \$(kube -n shoplite exec postgres-0 -- psql -U shoplite -d shoplite_restore -tAc 'SELECT count(*) FROM backup_check') = 42 ]"
check 'the backup account cannot read secrets' "[ \$(kube auth can-i get secrets -n shoplite --as=system:serviceaccount:shoplite:postgres-backup) = no ]"
exit "$failed"
