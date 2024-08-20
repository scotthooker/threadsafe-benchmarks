FROM golang:1.21.0

WORKDIR /app

COPY go.mod .
RUN go mod download

COPY . .

RUN go build -o benchmark

CMD ["./benchmark"]