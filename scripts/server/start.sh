#!/bin/bash

# Awesome MCP Registry - Start Script
# Starts the server in background with proper process management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PID_FILE="./server.pid"
LOG_FILE="./server.log"
PORT=${PORT:-3003}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if server is already running
is_server_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Server is running
        else
            # PID file exists but process is dead, clean up
            rm -f "$PID_FILE"
            return 1  # Server is not running
        fi
    else
        return 1  # Server is not running
    fi
}

# Function to wait for server to be ready
wait_for_server() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for server to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
            print_success "Server is ready and responding on port $PORT"
            return 0
        fi
        
        if [ $attempt -eq 1 ]; then
            echo -n "Waiting"
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    echo
    print_error "Server failed to start or become ready within 30 seconds"
    return 1
}

# Function to start the server
start_server() {
    print_status "Starting Awesome MCP Registry server..."
    
    # Check if server is already running
    if is_server_running; then
        local pid=$(cat "$PID_FILE")
        print_warning "Server is already running (PID: $pid)"
        print_status "Use './scripts/server/stop.sh' to stop the server first"
        exit 1
    fi
    
    # Ensure dependencies are up to date
    if [ ! -d "node_modules" ] || [ ! -d "dist" ]; then
        print_status "Dependencies or build files missing, running setup..."
        if [ -f "./scripts/server/install.sh" ]; then
            ./scripts/server/install.sh
        else
            print_error "install.sh not found. Please run the installation manually."
            exit 1
        fi
    fi
    
    # Start the server in background
    print_status "Starting server on port $PORT..."
    
    # Redirect output to log file and run in background
    nohup pnpm run server > "$LOG_FILE" 2>&1 &
    local server_pid=$!
    
    # Save PID to file
    echo "$server_pid" > "$PID_FILE"
    
    print_success "Server started with PID: $server_pid"
    print_status "Log file: $LOG_FILE"
    
    # Wait for server to be ready
    if wait_for_server; then
        echo
        print_success "🚀 Awesome MCP Registry is now running!"
        echo
        print_status "Access the application at: http://localhost:$PORT"
        print_status "API endpoint: http://localhost:$PORT/api"
        print_status "Use './scripts/server/stop.sh' to stop the server"
        echo
        print_status "To view real-time logs: tail -f $LOG_FILE"
    else
        # Server failed to start, clean up
        if [ -f "$PID_FILE" ]; then
            local pid=$(cat "$PID_FILE")
            kill "$pid" 2>/dev/null || true
            rm -f "$PID_FILE"
        fi
        
        print_error "Failed to start server. Check the log file: $LOG_FILE"
        if [ -f "$LOG_FILE" ]; then
            echo
            print_status "Last few lines of the log:"
            tail -10 "$LOG_FILE"
        fi
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -p, --port PORT    Set the port number (default: 3003)"
    echo "  -h, --help         Show this help message"
    echo
    echo "Environment variables:"
    echo "  PORT               Port number (default: 3003)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate port number
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    print_error "Invalid port number: $PORT"
    exit 1
fi

# Main execution
main() {
    start_server
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi