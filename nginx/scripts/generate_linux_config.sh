#!/bin/bash
repo_root=$(dirname ${BASH_SOURCE})/../..
source $repo_root/.env

cat <<EOF > ./nginx/conf.d/default.conf
server {
    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/nginx/ssl/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/$DOMAIN/privkey.pem;

    client_max_body_size 50M;

    root /var/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /images/ {
        alias /var/html/images/;
        autoindex on;
    }

    location ~ ^/(api|auth) {
        proxy_pass https://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
