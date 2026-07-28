# apps/ssh — Fly.io provisioning runbook

Nothing below has been run yet. `ssh-rama` does not exist as a Fly app. Do
these in order, from the **repo root** unless a step says otherwise.

## 0. Prerequisites

```bash
fly auth login
```

## 1. Create the app (don't let `fly launch` regenerate fly.toml)

`apps/ssh/fly.toml` is already hand-written and correct — the safest path is
to just register the app name and skip `fly launch`'s interactive scanner:

```bash
fly apps create ssh-rama
```

If you'd rather use `fly launch` (e.g. to pick an org interactively), you
MUST still run it from the repo root and tell it to keep our config instead
of writing a new one, or it will regenerate fly.toml from a Dockerfile scan
and likely get the build context wrong:

```bash
fly launch --no-deploy --copy-config --config apps/ssh/fly.toml --name ssh-rama --region cdg
```

## 2. Volume for the SSH host key

Fly Machines are ephemeral — without a mounted volume, every restart/redeploy
generates a new host key and every SSH client complains about a changed
fingerprint. `SSH_HOST_KEY_PATH=/data/host_key` (Dockerfile ENV) needs `/data`
to be persistent:

```bash
fly volume create host_keys --app ssh-rama --region cdg --size 1
```

(`--size 1` = 1GB, matches `initial_size = '1gb'` in `[[mounts]]`.)

## 3. Dedicated IPv4 (required — do not skip)

Fly's shared/anycast IPv4 only proxies HTTP(S)/TLS. Raw TCP on port 22 needs
a **dedicated** address:

```bash
fly ips allocate-v4 --app ssh-rama   # ~$2/mo, see cost breakdown below
fly ips allocate-v6 --app ssh-rama   # free, do it anyway
fly ips list --app ssh-rama          # note the IPv4 for the DNS step
```

## 4. First deploy

Must run from the repo root so the Docker build context includes
`apps/main/content/site-content.json` (see comment header in
`apps/ssh/fly.toml` and `apps/ssh/Dockerfile` for why):

```bash
fly deploy --config apps/ssh/fly.toml --dockerfile apps/ssh/Dockerfile --app ssh-rama
```

## 5. DNS — ssh.rama.app

- Add an **A record**: `ssh.rama.app` → the IPv4 from step 3.
- **DNS-only / grey-cloud** (Cloudflare proxy off) — Cloudflare's proxy only
  forwards HTTP(S)/443, not raw TCP:22. Orange-clouding this record breaks
  SSH entirely.
- Cert for the browser-facing HTTP→HTTPS redirect service (port 8080/443):

  ```bash
  fly certs create ssh.rama.app --app ssh-rama
  fly certs show ssh.rama.app --app ssh-rama   # check validation status
  ```

## 6. GitHub Actions — enable automated deploys

```bash
fly tokens create deploy --app ssh-rama -x 999999h   # or via the Fly dashboard
gh secret set FLY_API_TOKEN --repo <owner>/photo-rama --body "<paste token>"
```

Then edit `.github/workflows/fly-deploy-ssh.yml`: add a `push` trigger
(paths: `apps/ssh/**`, `apps/main/content/site-content.json`) alongside the
existing `workflow_dispatch`, now that the secret exists.

## Cost — roughly $5.50/mo

| Item                                          | Cost      |
|------------------------------------------------|-----------|
| shared-cpu-1x, 512MB, always-on (`min_machines_running = 1`, `auto_stop_machines = 'off'`) | ~$3.19/mo |
| Dedicated IPv4 (required for raw TCP:22)      | $2.00/mo  |
| Volume, 1GB (host key persistence)            | $0.15/mo  |
| **Total**                                     | **~$5.34–5.50/mo** |

(IPv6 is free; outbound bandwidth is negligible for a personal SSH portfolio
and covered by Fly's free allowance.)

Cheaper alternative: a Hetzner CX22 VPS (~€4.5/mo) running this as a plain
`systemd` service — no dedicated-IP or per-GB-volume surcharges, but you own
patching/backups/restart-on-crash instead of Fly Machines handling it.

## Local test (no Fly involved)

```bash
cd apps/ssh
SSH_HOST_KEY_PATH=./.dev-host-key bun run ssh   # runs `bun run src/ssh-server.tsx`
```

In another terminal:

```bash
ssh -p 2222 localhost
```

(`SSH_HOST_KEY_PATH` is overridden to a local file here — the default
`/data/host_key` only exists inside the deployed Fly volume.)
