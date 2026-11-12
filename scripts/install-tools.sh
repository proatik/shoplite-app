#!/usr/bin/env bash
# Installs the pinned tools a lab VM needs to build ShopLite on AWS into ~/.local/bin, checking every
# download's checksum: terraform, ansible, helm, kubectl, the aws cli and its session manager plugin.
set -euo pipefail

UV_VERSION=0.13.7
TERRAFORM_VERSION=1.17.1
HELM_VERSION=v4.3.1
ANSIBLE_CORE_VERSION=2.21.6
KUBECTL_VERSION=v1.37.2
AWS_CLI_VERSION=2.39.3
AWS_CLI_SHA256=14cb35809ad7547dd3c69fa9899a3975fbd850b6a6791f3fe264856490cd9a63
SSM_PLUGIN_VERSION=1.2.896.0
SSM_PLUGIN_SHA256=53f51fcc67314a4bf85888a38a3967cd41f8d0f28a60a9469a63acf935ba713e

bin=~/.local/bin
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$bin"
cd "$work"

fetch() {
  local name attempt
  name=$(basename "$1")
  for attempt in 1 2 3 4 5; do
    curl -sSfL --retry 3 --retry-connrefused -C - -o "$name" "$1" && return 0
    echo "download of $name failed (attempt $attempt of 5), resuming" >&2
    sleep 3
  done
  return 1
}
unzip_one() { python3 -c 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extract(sys.argv[2])' "$1" "$2"; }

uv_tar=uv-x86_64-unknown-linux-gnu.tar.gz
fetch "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/$uv_tar"
fetch "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/$uv_tar.sha256"
sha256sum -c "$uv_tar.sha256"
tar xzf "$uv_tar"
install -m 0755 uv-x86_64-unknown-linux-gnu/uv "$bin/uv"

tf_zip="terraform_${TERRAFORM_VERSION}_linux_amd64.zip"
fetch "https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/$tf_zip"
fetch "https://releases.hashicorp.com/terraform/$TERRAFORM_VERSION/terraform_${TERRAFORM_VERSION}_SHA256SUMS"
grep " $tf_zip\$" "terraform_${TERRAFORM_VERSION}_SHA256SUMS" | sha256sum -c -
unzip_one "$tf_zip" terraform
install -m 0755 terraform "$bin/terraform"

helm_tar="helm-$HELM_VERSION-linux-amd64.tar.gz"
fetch "https://get.helm.sh/$helm_tar"
fetch "https://get.helm.sh/$helm_tar.sha256sum"
sha256sum -c "$helm_tar.sha256sum"
tar xzf "$helm_tar"
install -m 0755 linux-amd64/helm "$bin/helm"

fetch "https://dl.k8s.io/release/$KUBECTL_VERSION/bin/linux/amd64/kubectl"
fetch "https://dl.k8s.io/release/$KUBECTL_VERSION/bin/linux/amd64/kubectl.sha256"
echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -
install -m 0755 kubectl "$bin/kubectl"

aws_zip="awscli-exe-linux-x86_64-$AWS_CLI_VERSION.zip"
fetch "https://awscli.amazonaws.com/$aws_zip"
echo "$AWS_CLI_SHA256  $aws_zip" | sha256sum -c -
python3 -c 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall()' "$aws_zip"
chmod -R u+x aws
./aws/install --update --install-dir ~/.local/aws-cli --bin-dir "$bin"

fetch "https://s3.amazonaws.com/session-manager-downloads/plugin/$SSM_PLUGIN_VERSION/ubuntu_64bit/session-manager-plugin.deb"
echo "$SSM_PLUGIN_SHA256  session-manager-plugin.deb" | sha256sum -c -
dpkg-deb -x session-manager-plugin.deb ssm
install -m 0755 ssm/usr/local/sessionmanagerplugin/bin/session-manager-plugin "$bin/session-manager-plugin"

"$bin/uv" tool install --python 3.12 "ansible-core==$ANSIBLE_CORE_VERSION"

echo "installed: $("$bin/uv" --version), $("$bin/terraform" version | head -1), helm $("$bin/helm" version --short), kubectl $KUBECTL_VERSION, $("$bin/aws" --version | cut -d" " -f1), session-manager-plugin $SSM_PLUGIN_VERSION"
