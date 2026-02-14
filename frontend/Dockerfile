FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./

COPY . .

RUN apk update && \
    apk upgrade --no-cache && \
    npm install --force && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /root/.npm /root/.node-gyp


RUN npm run build

FROM nginx:alpine

COPY --from=build /app/public /usr/share/nginx/html

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
