# syntax=docker/dockerfile:1
#
# apps/ssh — SSH terminal portfolio (Bun + @opentui/ssh)
#
# IMPORTANT: build context is the MONOREPO ROOT, not this directory.
# src/content.ts does `import siteContent from '../../main/content/site-content.json'`,
# so the image needs apps/main/content/ alongside apps/ssh/ under /app — that's
# only reachable if Docker's context starts at the repo root. Build/deploy from
# the repo root, e.g.:
#   docker build -f apps/ssh/Dockerfile .
#   fly deploy --config apps/ssh/fly.toml --dockerfile apps/ssh/Dockerfile
# (see apps/ssh/TODO.md for the full deploy runbook)

FROM oven/bun:1.3-slim

# tini becomes PID 1 so SIGTERM from `fly deploy` / `docker stop` is forwarded
# to the Bun process (and the ssh2 connections it holds) instead of being
# ignored the way PID 1 ignores signals by default.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends tini \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/ssh

# Install deps from the manifest alone first so this layer stays cached across
# source-only changes. There is no committed bun lockfile for apps/ssh (the
# monorepo's single lockfile is pnpm's at the repo root, and Bun doesn't read
# it) — so this is a plain `bun install`, not `--frozen-lockfile`.
COPY apps/ssh/package.json ./
RUN bun install --production

# Bring in the rest of the app. apps/ssh/node_modules from the host checkout
# is excluded by the repo-root .dockerignore, so this can't shadow the
# production install above with a dev-dependency-laden local one.
COPY apps/ssh /app/apps/ssh

# ...and the one file the app reaches for outside its own directory. Keep this
# path shape (apps/main/content/site-content.json relative to /app) identical
# to the monorepo layout, or the relative import in content.ts breaks.
COPY apps/main/content/site-content.json /app/apps/main/content/site-content.json

ENV NODE_ENV=production \
	SSH_PORT=2222 \
	HTTP_PORT=8080 \
	SSH_HOST_KEY_PATH=/data/host_key

# 2222 = SSH portfolio, 8080 = plain-HTTP redirect to the real site.
EXPOSE 2222 8080

ENTRYPOINT ["tini", "-s", "--"]
CMD ["bun", "run", "src/ssh-server.tsx"]
