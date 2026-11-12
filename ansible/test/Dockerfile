FROM ubuntu:24.04@sha256:fe81560990fae86dc4743202b2cb4d3df98d0bcf949173cecef15ce1127ef852

RUN apt-get update \
  && apt-get install -y --no-install-recommends systemd systemd-sysv openssh-server python3 sudo ca-certificates iproute2 \
  && rm -rf /var/lib/apt/lists/* \
  && echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/90-cloud-init-users \
  && chmod 0440 /etc/sudoers.d/90-cloud-init-users \
  && systemctl enable ssh

STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init"]
