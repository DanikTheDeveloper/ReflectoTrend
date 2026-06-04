FROM golang:1.22

WORKDIR /go/src/app

COPY . .

RUN go mod download

RUN CGO_ENABLED=1 GOOS=linux go build -o /go/bin/app

EXPOSE 8080

CMD ["/go/bin/app"]

