FROM node:22-alpine as builder

WORKDIR /usr/src/frontend  

COPY . . 

RUN apk update && \
    apk upgrade --no-cache && \
    npm install --force && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp

RUN npm run build --no-cache

FROM nginx:latest

COPY --from=builder /usr/src/frontend/public /var/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
