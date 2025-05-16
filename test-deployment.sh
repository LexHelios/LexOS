#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${GREEN}[✓] $1${NC}"
}

print_error() {
    echo -e "${RED}[✗] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[!] $1${NC}"
}

# Test system dependencies
test_dependencies() {
    print_status "Testing system dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        return 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        return 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 is not installed"
        return 1
    fi
    
    # Check Redis
    if ! systemctl is-active --quiet redis-server; then
        print_error "Redis is not running"
        return 1
    fi
    
    # Check Nginx
    if ! systemctl is-active --quiet nginx; then
        print_error "Nginx is not running"
        return 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        return 1
    fi
    
    print_status "All system dependencies are installed and running"
    return 0
}

# Test Redis connection
test_redis() {
    print_status "Testing Redis connection..."
    
    if ! redis-cli -a "${REDIS_PASSWORD}" ping &> /dev/null; then
        print_error "Cannot connect to Redis"
        return 1
    fi
    
    print_status "Redis connection successful"
    return 0
}

# Test backend
test_backend() {
    print_status "Testing backend..."
    
    # Check if backend is running
    if ! systemctl is-active --quiet lexcommand-backend; then
        print_error "Backend service is not running"
        return 1
    fi
    
    # Test health endpoint
    if ! curl -s http://localhost:8000/health | grep -q "healthy"; then
        print_error "Backend health check failed"
        return 1
    fi
    
    # Test metrics endpoint
    if ! curl -s http://localhost:8000/metrics &> /dev/null; then
        print_error "Backend metrics endpoint is not accessible"
        return 1
    fi
    
    print_status "Backend is running and healthy"
    return 0
}

# Test frontend
test_frontend() {
    print_status "Testing frontend..."
    
    # Check if build directory exists
    if [ ! -d "/opt/lexcommand/frontend/build" ]; then
        print_error "Frontend build directory not found"
        return 1
    fi
    
    # Check if index.html exists
    if [ ! -f "/opt/lexcommand/frontend/build/index.html" ]; then
        print_error "Frontend index.html not found"
        return 1
    fi
    
    # Test frontend accessibility
    if ! curl -s http://localhost:80 | grep -q "<html"; then
        print_error "Frontend is not accessible"
        return 1
    fi
    
    print_status "Frontend is built and accessible"
    return 0
}

# Test SSL
test_ssl() {
    print_status "Testing SSL configuration..."
    
    if ! curl -s -k https://localhost:443 &> /dev/null; then
        print_error "SSL is not properly configured"
        return 1
    fi
    
    print_status "SSL is properly configured"
    return 0
}

# Test monitoring stack
test_monitoring() {
    print_status "Testing monitoring stack..."
    
    # Check Prometheus
    if ! curl -s http://localhost:9090/-/healthy &> /dev/null; then
        print_error "Prometheus is not running"
        return 1
    fi
    
    # Check Grafana
    if ! curl -s http://localhost:3000/api/health &> /dev/null; then
        print_error "Grafana is not running"
        return 1
    fi
    
    print_status "Monitoring stack is running"
    return 0
}

# Test WebSocket
test_websocket() {
    print_status "Testing WebSocket connection..."
    
    # Create a simple WebSocket test script
    cat > /tmp/websocket_test.js << 'EOL'
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('open', () => {
    console.log('WebSocket connection successful');
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('WebSocket connection failed:', error);
    process.exit(1);
});

setTimeout(() => {
    console.error('WebSocket connection timeout');
    process.exit(1);
}, 5000);
EOL
    
    # Run the test
    if ! node /tmp/websocket_test.js &> /dev/null; then
        print_error "WebSocket connection failed"
        return 1
    fi
    
    print_status "WebSocket connection successful"
    return 0
}

# Test backup system
test_backup() {
    print_status "Testing backup system..."
    
    # Run backup script
    if ! /opt/lexcommand/backup.sh; then
        print_error "Backup script failed"
        return 1
    fi
    
    # Check if backup was created
    if [ ! -d "/opt/lexcommand/backups" ]; then
        print_error "Backup directory not found"
        return 1
    fi
    
    print_status "Backup system is working"
    return 0
}

# Main test execution
main() {
    local failed=0
    
    # Run all tests
    test_dependencies || failed=1
    test_redis || failed=1
    test_backend || failed=1
    test_frontend || failed=1
    test_ssl || failed=1
    test_monitoring || failed=1
    test_websocket || failed=1
    test_backup || failed=1
    
    if [ $failed -eq 0 ]; then
        print_status "All tests passed! System is ready for production."
    else
        print_error "Some tests failed. Please check the errors above."
        exit 1
    fi
}

# Run main function
main 