# Linux evidence

Terminal screenshots from the lab nodes for Question 3: users and SSH, permissions, backup and firewall.

### Session on the control plane

Ubuntu 24.04 node reached through the bastion.

![Session on the control plane](q3-00a-node-login.png)

### Session on the bastion

The only host with a public address.

![Session on the bastion](q3-00b-bastion-login.png)

### 3.1 User and group

deploy is in ops.

![3.1 User and group](q3-01-deploy-user.png)

### 3.1 Root login refused

The server rejects root over SSH.

![3.1 Root login refused](q3-02-root-login-refused.png)

### First connection to the node

The bastion confirms the node's host key once.

![First connection to the node](q3-02a-host-key-prompt.png)

### Root refused, server side

sshd logs root as not allowed by AllowGroups.

![Root refused, server side](q3-02b-root-refused-server-log.png)

### First attempt timed out

LoginGraceTime 30 closed the connection while the host-key prompt waited.

![First attempt timed out](q3-02c-first-attempt-timeout.png)

### 3.1 Password login refused

Without a key, the login is refused.

![3.1 Password login refused](q3-03-password-login-refused.png)

### 3.2 Log directory permissions

Owner, mode and the single ACL rule.

![3.2 Log directory permissions](q3-04-log-permissions.png)

### 3.3 Backup service

The last run finished successfully.

![3.3 Backup service](q3-05-backup-status.png)

### Backup unit file

Restart=on-failure, its own user and a hardened sandbox.

![Backup unit file](q3-05b-backup-unit.png)

### 3.3 Nightly timer

The next run is scheduled for 02:00.

![3.3 Nightly timer](q3-06-backup-timer.png)

### 3.3 Backup files

Dumps in /var/backups/shoplite/ and in S3.

![3.3 Backup files](q3-07-backup-files.png)

### Backup copied to S3

The same dump in the backup bucket.

![Backup copied to S3](q3-07b-backup-s3.png)

### 3.4 Firewall rules

Default deny; 22, 80, 443 allowed.

![3.4 Firewall rules](q3-08-ufw-status.png)

### 3.4 Listening ports

Only the expected services are listening.

![3.4 Listening ports](q3-09-listening-ports.png)

### 3.4 Open and blocked port from another machine

Port 22 answers; a closed port times out.

![3.4 Open and blocked port from another machine](q3-10-open-and-blocked.png)
