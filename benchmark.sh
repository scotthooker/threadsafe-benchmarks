#!/bin/bash

# @@filename: benchmark.sh

# Ensure both services are running before starting the benchmark

# Define the endpoints
GO_ENDPOINT="http://localhost:8080/reservations"
NODE_ENDPOINT="http://localhost:3000/reservations"

# Define the benchmark parameters
CONCURRENCY=100
REQUESTS=10000
TIMEOUT=30

# Function to run benchmark
run_benchmark() {
    SERVICE=$1
    ENDPOINT=$2
    echo "Benchmarking $SERVICE service..."
    ab -n $REQUESTS -c $CONCURRENCY -s $TIMEOUT -T 'application/json' -p payload.json $ENDPOINT
    echo "----------------------------------------"
}

# Create a sample payload for the reservation request
echo '{"seatId": "A1", "userId": "user123"}' > payload.json

# Run benchmarks
run_benchmark "Go" $GO_ENDPOINT
run_benchmark "Node.js" $NODE_ENDPOINT

# Clean up
rm payload.json