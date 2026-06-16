#!/usr/bin/env bash
# Deploy/update MIRROR on the EC2 box. Run from the repo root after `git pull`.
# Requires: the shared `webnet` network + a `mongo` container already running
# (see deploy/docker-compose.prod.yml header), SESSION_SECRET in the environment.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ building + (re)starting the server container"
docker compose -f deploy/docker-compose.prod.yml up -d --build

echo "→ building the client for production"
VITE_SERVER_URL="https://mirror.tradyai.live" npm --prefix client ci
VITE_SERVER_URL="https://mirror.tradyai.live" npm --prefix client run build

echo "→ publishing the static client to /srv/mirror"
sudo mkdir -p /srv/mirror
sudo rsync -a --delete client/dist/ /srv/mirror/

echo "→ reloading nginx"
sudo cp deploy/nginx.conf /etc/nginx/conf.d/mirror.conf
sudo nginx -t && sudo nginx -s reload

echo "✓ MIRROR deployed → https://mirror.tradyai.live"
