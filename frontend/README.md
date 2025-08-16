## Frontend 

## How to Deploy Frontend for Development

```bash
ln -s envs/staging-env.sh .env
yarn install --force
yarn run serve
```

Configuration related to serving the dev server is in `webpack.config.js`

Public files are served from `public/` folder

All the other javascript files are in `src/` folder.

## How to Build for production:

```bash
yarn run build
```

This will build the main.js and css files required, to be served from public
folder using Nginx. 

## TO DO:

1. Make nginx configuration
2. Dockerization.
3. Get certs using cloudflare. 