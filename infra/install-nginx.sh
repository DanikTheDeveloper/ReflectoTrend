#!/usr/bin/env bash
# Installs reflecto-trend's host nginx site into sites-available/sites-enabled.
#
# Each site on the VPS owns one file in /etc/nginx/sites-available, enabled
# via a symlink in sites-enabled (Debian layout). All sites share the host's
# single nginx — see /etc/nginx/nginx.conf (`include sites-enabled/*`).
# On AlmaLinux the main nginx.conf lacks that include by default; this
# script adds it if missing (idempotent).
#
#   sudo ./infra/install-nginx.sh
#
# Host nginx is a plain reverse proxy to Docker: / -> 127.0.0.1:8081 (frontend
# container) and /api|/auth -> 127.0.0.1:8080 (backend container). No files are
# served from the host; `docker compose up -d` must be running.
# Idempotent: run again after changing infra/nginx.conf.

set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root (sudo)." >&2
  exit 1
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/nginx.conf"
DEST_AVAILABLE="/etc/nginx/sites-available/reflecto-trend"
DEST_ENABLED="/etc/nginx/sites-enabled/reflecto-trend"
OLD_CONF_D="/etc/nginx/conf.d/reflecto-trend.conf"
NGINX_CONF="/etc/nginx/nginx.conf"

# Ensure host nginx.conf includes sites-enabled (AlmaLinux omits it).
if ! grep -q "include /etc/nginx/sites-enabled" "$NGINX_CONF" 2>/dev/null; then
  echo "Adding 'include /etc/nginx/sites-enabled/*;' to $NGINX_CONF"
  # Insert after the existing conf.d include; fallback to before closing } of http
  if grep -q "include /etc/nginx/conf.d" "$NGINX_CONF"; then
    sed -i '/include \/etc\/nginx\/conf.d/a \    include /etc/nginx/sites-enabled/*;' "$NGINX_CONF"
  else
    sed -i '/http {/a \    include /etc/nginx/sites-enabled/*;' "$NGINX_CONF"
  fi
fi

# Ensure sites-enabled/sites-available directories exist (Debian creates them,
# AlmaLinux does not).
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Install to sites-available and enable via symlink.
install -m 644 "$SRC" "$DEST_AVAILABLE"
ln -sf "$DEST_AVAILABLE" "$DEST_ENABLED"

# Clean up legacy location if it exists.
if [ -f "$OLD_CONF_D" ]; then
  rm -f "$OLD_CONF_D"
  echo "Removed legacy $OLD_CONF_D"
fi

# Refuse to leave nginx broken: test first, reload only if the config is sound.
nginx -t
systemctl reload nginx

echo "reflecto-trend nginx site installed to $DEST_AVAILABLE (enabled via $DEST_ENABLED)"
