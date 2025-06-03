#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check service health
check_service() {
    local service=$1
    local url=$2
    local expected_status=$3

    echo -n "Checking $service... "
    response=$(curl -s -w "\n%{http_code}" $url)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        echo "Status code: $status_code"
        echo "Response: $body"
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo -n "Checking database connection... "
    if docker-compose exec db pg_isready -U lexos_user -d lexos > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Function to check Redis connection
check_redis() {
    echo -n "Checking Redis connection... "
    if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

# Main health check
echo "Starting health check..."

# Check API
check_service "API" "http://localhost:8000/health" 200

# Check WebSocket
check_service "WebSocket" "http://localhost:8001/health" 200

# Check Frontend
check_service "Frontend" "http://localhost" 200

# Check Database
check_database

# Check Redis
check_redis

# Check Prometheus
check_service "Prometheus" "http://localhost:9090/-/healthy" 200

# Check Grafana
check_service "Grafana" "http://localhost:3000/api/health" 200

echo "Health check completed." 