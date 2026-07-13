#!/bin/bash

repo_root=$(dirname ${BASH_SOURCE})
source "$repo_root/.env"

certbot certonly \
    --non-interactive \
    --agree-tos \
    --email "piyushkhurana38@gmail.com" \
    --dns-cloudflare \
    --dns-cloudflare-propagation-seconds 60 \
    --dns-cloudflare-credentials /home/pka42/cloudflare.ini \
    -d "${site_url}" \
    -d "www.${site_url}"
