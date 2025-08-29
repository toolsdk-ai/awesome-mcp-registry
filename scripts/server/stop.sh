#!/bin/bash

# Awesome MCP Registry - Stop Script
# Stops the background server gracefully

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

# Function to check if server is running
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

# Function to stop server gracefully
stop_server_graceful() {
    local pid=$1
    local timeout=${2:-10}
    
    print_status "Sending TERM signal to process $pid..."
    kill -TERM "$pid" 2>/dev/null || {
        print_warning "Failed to send TERM signal to process $pid"
        return 1
    }
    
    # Wait for graceful shutdown
    local count=0
    while [ $count -lt $timeout ]; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            print_success "Server stopped gracefully"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        if [ $count -eq 1 ]; then
            echo -n "Waiting for graceful shutdown"
        fi
        echo -n "."
    done
    echo
    
    return 1  # Timeout reached
}

# Function to force stop server
stop_server_force() {
    local pid=$1
    
    print_warning "Force stopping process $pid..."
    kill -KILL "$pid" 2>/dev/null || {
        print_error "Failed to force stop process $pid"
        return 1
    }
    
    # Wait a moment for the process to die
    sleep 2
    
    if ps -p "$pid" > /dev/null 2>&1; then
        print_error "Process $pid is still running after force stop"
        return 1
    else
        print_success "Server force stopped"
        return 0
    fi
}

# Function to stop all related processes
stop_all_processes() {
    print_status "Looking for any remaining MCP Registry processes..."
    
    # Find processes by command pattern
    local pids=$(pgrep -f "node.*src/api/index.ts" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_status "Found additional processes: $pids"
        for pid in $pids; do
            print_status "Stopping process $pid..."
            kill -TERM "$pid" 2>/dev/null || true
        done
        sleep 2
        
        # Force kill if still running
        for pid in $pids; do
            if ps -p "$pid" > /dev/null 2>&1; then
                print_warning "Force stopping stubborn process $pid..."
                kill -KILL "$pid" 2>/dev/null || true
            fi
        done
    fi
}

# Function to clean up files
cleanup_files() {
    print_status "Cleaning up..."
    
    # Remove PID file
    if [ -f "$PID_FILE" ]; then
        rm -f "$PID_FILE"
        print_status "Removed PID file"
    fi
    
    # Optionally clean up log file
    if [ "$CLEAN_LOGS" = "true" ] && [ -f "$LOG_FILE" ]; then
        rm -f "$LOG_FILE"
        print_status "Removed log file"
    fi
}

# Main stop function
stop_server() {
    print_status "Stopping Awesome MCP Registry server..."
    
    # Check if server is running
    if ! is_server_running; then
        print_warning "Server is not running (no PID file found or process not active)"
        
        # Still check for orphaned processes
        stop_all_processes
        cleanup_files
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    print_status "Found server running with PID: $pid"
    
    # Try graceful shutdown first
    if stop_server_graceful "$pid" 15; then
        cleanup_files
        print_success "✅ Server stopped successfully"
        return 0
    fi
    
    # If graceful shutdown failed, force stop
    print_warning "Graceful shutdown failed, attempting force stop..."
    if stop_server_force "$pid"; then
        cleanup_files
        print_success "✅ Server force stopped successfully"
        return 0
    fi
    
    # If force stop failed, try to find and stop any related processes
    print_error "Failed to stop main process, looking for related processes..."
    stop_all_processes
    cleanup_files
    
    print_error "Some processes may still be running. You may need to stop them manually."
    return 1
}

# Function to show server status before stopping
show_status() {
    if is_server_running; then
        local pid=$(cat "$PID_FILE")
        print_status "Server status before stopping:"
        echo "  PID: $pid"
        echo "  Memory usage: $(ps -o rss= -p "$pid" 2>/dev/null | awk '{print $1/1024 "MB"}' || echo "unknown")"
        echo "  CPU usage: $(ps -o %cpu= -p "$pid" 2>/dev/null || echo "unknown")"
        echo "  Running time: $(ps -o etime= -p "$pid" 2>/dev/null | xargs || echo "unknown")"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --clean-logs       Remove log file after stopping"
    echo "  --force            Force stop without graceful shutdown"
    echo "  --status           Show server status before stopping"
    echo "  -h, --help         Show this help message"
}

# Parse command line arguments
CLEAN_LOGS="false"
FORCE_STOP="false"
SHOW_STATUS="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean-logs)
            CLEAN_LOGS="true"
            shift
            ;;
        --force)
            FORCE_STOP="true"
            shift
            ;;
        --status)
            SHOW_STATUS="true"
            shift
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

# Main execution
main() {
    if [ "$SHOW_STATUS" = "true" ]; then
        show_status
        echo
    fi
    
    if [ "$FORCE_STOP" = "true" ]; then
        print_warning "Force stop requested"
        if is_server_running; then
            local pid=$(cat "$PID_FILE")
            stop_server_force "$pid"
            cleanup_files
        else
            print_warning "No server to force stop"
        fi
    else
        stop_server
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi