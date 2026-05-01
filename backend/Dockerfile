FROM golang:1.22-alpine

WORKDIR /go/src/app

COPY . .

RUN go mod download

RUN apk update && \
    apk upgrade --no-cache

RUN apk add sqlite
RUN CGO_ENABLED=0 GOOS=linux go build -o /go/bin/app

EXPOSE 8080

CMD ["/go/bin/app"]

