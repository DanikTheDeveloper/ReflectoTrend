FROM node:22-alpine as builder

WORKDIR /usr/src/frontend  

COPY . . 

RUN apk update && \
    apk upgrade --no-cache && \
    npm install --force && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

RUN npm run build --no-cache

FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /usr/src/frontend/public /app/public

EXPOSE 8081

CMD ["serve", "-s", "public", "-l", "8081"]
