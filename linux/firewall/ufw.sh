#!/usr/bin/env bash
# Applies ShopLite's inbound firewall: deny by default, ssh from the admin networks, web on 80 and 443,
# and on k3s nodes the cluster ports from the node network only. Safe to run again: it only adds what
# is missing and prints "firewall changed" when the rules differ from before.
#
#   ADMIN_CIDRS        networks allowed to ssh, space separated (required)
#   NODE_CIDR          the private node network; set it on k3s nodes to open the cluster ports
#   K3S_ROLE           server or agent; the server also opens the kubernetes api
#   INGRESS_NODE_PORTS the ingress NodePorts the load balancer reaches, one per environment
#   CLUSTER_CIDRS      pod and service networks, space separated
set -euo pipefail

: "${ADMIN_CIDRS:?set ADMIN_CIDRS to the networks allowed to ssh}"

before=$(ufw status verbose)

ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null

for cidr in $ADMIN_CIDRS; do
  ufw allow proto tcp from "$cidr" to any port 22 > /dev/null
done
ufw allow 80/tcp > /dev/null
ufw allow 443/tcp > /dev/null

if [ -n "${NODE_CIDR:-}" ]; then
  if [ "${K3S_ROLE:-}" = server ]; then
    for cidr in $NODE_CIDR $ADMIN_CIDRS; do
      ufw allow proto tcp from "$cidr" to any port 6443 > /dev/null
    done
  fi
  ufw allow proto tcp from "$NODE_CIDR" to any port 10250 > /dev/null
  ufw allow proto udp from "$NODE_CIDR" to any port 8472 > /dev/null
  ufw allow proto tcp from "$NODE_CIDR" to any port 9100 > /dev/null
  for port in ${INGRESS_NODE_PORTS:-}; do
    ufw allow proto tcp from "$NODE_CIDR" to any port "$port" > /dev/null
  done
  for cidr in ${CLUSTER_CIDRS:-}; do
    ufw allow from "$cidr" > /dev/null
  done
fi

ufw --force enable > /dev/null

if [ "$before" != "$(ufw status verbose)" ]; then
  echo 'firewall changed'
fi
