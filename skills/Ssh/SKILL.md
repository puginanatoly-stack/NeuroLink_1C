---
name: Ssh
version: 1.0.0
description: SSH connectivity and remote execution on Linux servers from Windows/Git Bash — key-based auth setup, non-interactive command quoting, connection multiplexing for low-latency repeated calls, host-key verification, scp/rsync file transfer, jump hosts, and diagnosing common connection failures. USE WHEN ssh into a server, connect to a Linux box, run a remote command, deploy an SSH key, permission denied publickey, host key verification failed, scp or rsync a file, jump host, bastion, ProxyJump, connection refused vs timeout. NOT FOR a target that's actually a local VirtualBox/Hyper-V VM without SSH configured yet (use the hypervisor's guest-exec fallback — see Gotchas) or for managing this machine's own local shell (use Bash directly).
---

# Ssh

Reference for connecting to and working with Linux servers over SSH from this Windows machine's
Git Bash / OpenSSH client. Everything needed lives in this file — no separate workflows.

## Quick Reference

- **Prefer key auth over passwords.** Generate: `ssh-keygen -t ed25519 -C "<label>" -f ~/.ssh/<name>`. Deploy: `ssh-copy-id -i ~/.ssh/<name>.pub user@host` where available — **Windows OpenSSH doesn't bundle `ssh-copy-id` by default**, fall back to `cat ~/.ssh/<name>.pub | ssh user@host "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"`.
- **Non-interactive commands:** `ssh user@host "command"`. This machine's Bash tool is Git Bash (POSIX) and the remote shell is also POSIX — quoting nests the same way it would between two POSIX shells (escape inner double-quotes, or write the remote command to a local file and pipe it in via `ssh user@host bash -s < script.sh` for anything non-trivial rather than fighting nested-quote escaping inline).
- **Multiplexing for repeated calls to the same host** (real latency win when making many sequential SSH calls in one session): in `~/.ssh/config`
  ```
  Host <alias>
    HostName <host>
    User <user>
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
  ```
  First connection pays the handshake; every call after reuses the open socket until 10 minutes idle.
- **File transfer:** `scp file user@host:path` for one-off small files; `rsync -avz -e ssh src/ user@host:dst/` for anything large, incremental, or that might need to resume after interruption.
- **Jump host / bastion:** `ssh -J user@bastion user@target` (or `ProxyJump user@bastion` in `~/.ssh/config`) when the target isn't directly reachable.

## Gotchas

- **`Permission denied (publickey)` is almost never "wrong key."** Check in this order: (1) key actually in `~/.ssh/authorized_keys` on the remote, (2) permissions on remote `~/.ssh` (must be `700`) and `authorized_keys` (must be `600`) — sshd silently ignores keys if these are too open, with no error hinting at the real cause, (3) connecting as the wrong user, (4) `IdentitiesOnly yes` needed if the local agent is offering a different key first and the server's `MaxAuthTries` is being exhausted before it reaches the right one.
- **`Host key verification failed` after a legitimate host rebuild (VM reimage, IP reuse) needs a targeted fix, not a blanket one.** Remove just that entry: `ssh-keygen -R <host>` (or `-R [host]:port` for non-default ports), then reconnect and verify the new fingerprint out-of-band if the host is at all sensitive. Do not default to `StrictHostKeyChecking=no` — that silently disables MITM protection for every future connection to that alias, not just this one.
- **Connection timeout vs. connection refused are different failures.** Refused means something is listening on the network path but nothing is accepting on that port (service down, wrong port) — fails fast. Timeout means packets aren't getting a response at all (firewall dropping silently, host down, wrong IP/routing) — fails slow. Diagnose accordingly; a firewall rule fix and a "start sshd" fix are not interchangeable.
- **On Windows, SSH isn't always the only or even the first path to a target.** If the target is actually a VM under VirtualBox/Hyper-V and SSH isn't confirmed working yet (sshd not verified running, no key deployed), the hypervisor's own guest-exec channel is a working fallback that needs no network path: `VBoxManage guestcontrol <vm> run --username <u> --password <p> -- <command>` (Hyper-V: `Invoke-Command` via PowerShell Direct). Useful for bootstrapping SSH access itself (deploy the key via guest-exec, then switch to SSH) rather than assuming SSH must already be configured.
- **Git Bash on Windows silently mangles POSIX-looking paths passed to remote commands** if the local path resembles `/c/...` — set `MSYS_NO_PATHCONV=1` for that one call when a `/`-prefixed argument is meant literally for the *remote* side, not translated to a Windows path first.
