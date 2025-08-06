#!/bin/bash

# Awesome MCP Registry - Status Script
# Checks the status of the background server and shows detailed information

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PID_FILE="./server.pid"
LOG_FILE="./server.log"
PORT=${PORT:-3000}

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

print_header() {
    echo -e "${PURPLE}[STATUS]${NC} $1"
}

print_detail() {
    echo -e "${CYAN}[DETAIL]${NC} $1"
}

# Function to check if server is running
is_server_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "$pid"
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

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -i :"$port" >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -an | grep ":$port " | grep LISTEN >/dev/null 2>&1
    else
        # Fallback: try to connect
        timeout 1 bash -c "</dev/tcp/localhost/$port" >/dev/null 2>&1
    fi
}

# Function to get process information
get_process_info() {
    local pid=$1
    
    echo "Process Information:"
    echo "  PID: $pid"
    
    # Process name and command
    if command -v ps >/dev/null 2>&1; then
        local cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
        local args=$(ps -p "$pid" -o args= 2>/dev/null || echo "unknown")
        echo "  Command: $cmd"
        echo "  Arguments: $args"
        
        # Memory usage
        local memory=$(ps -p "$pid" -o rss= 2>/dev/null | awk '{print $1}' || echo "0")
        if [ "$memory" != "0" ] && [ -n "$memory" ]; then
            local memory_mb=$(echo "$memory" | awk '{print $1/1024}')
            echo "  Memory: ${memory}KB (${memory_mb}MB)"
        fi
        
        # CPU usage
        local cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | xargs || echo "unknown")
        echo "  CPU: ${cpu}%"
        
        # Running time
        local etime=$(ps -p "$pid" -o etime= 2>/dev/null | xargs || echo "unknown")
        echo "  Uptime: $etime"
        
        # Parent process
        local ppid=$(ps -p "$pid" -o ppid= 2>/dev/null | xargs || echo "unknown")
        echo "  Parent PID: $ppid"
    fi
}

# Function to check server health
check_server_health() {
    local port=$1
    
    echo "Server Health Check:"
    
    # Check if port is responding
    if curl -s --max-time 5 "http://localhost:$port" >/dev/null 2>&1; then
        print_success "  ✅ HTTP server responding on port $port"
        
        # Check response time
        local response_time=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:$port" 2>/dev/null || echo "unknown")
        echo "  Response time: ${response_time}s"
        
        # Check if it's actually our server
        local server_header=$(curl -s -I "http://localhost:$port" 2>/dev/null | grep -i "server:" || echo "")
        if [ -n "$server_header" ]; then
            echo "  Server header: $server_header"
        fi
        
    else
        print_error "  ❌ HTTP server not responding on port $port"
        return 1
    fi
    
    return 0
}

# Function to show log information
show_log_info() {
    echo "Log Information:"
    
    if [ -f "$LOG_FILE" ]; then
        local log_size=$(du -h "$LOG_FILE" 2>/dev/null | cut -f1 || echo "unknown")
        local log_lines=$(wc -l < "$LOG_FILE" 2>/dev/null || echo "unknown")
        local log_modified=$(ls -l "$LOG_FILE" 2>/dev/null | awk '{print $6, $7, $8}' || echo "unknown")
        
        echo "  Log file: $LOG_FILE"
        echo "  Size: $log_size"
        echo "  Lines: $log_lines"
        echo "  Last modified: $log_modified"
        
        # Show recent log entries
        echo "  Recent log entries (last 5 lines):"
        tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/    /' || echo "    (unable to read log file)"
    else
        print_warning "  Log file not found: $LOG_FILE"
    fi
}

# Function to show system information
show_system_info() {
    echo "System Information:"
    
    # Available memory
    if command -v free >/dev/null 2>&1; then
        local mem_info=$(free -h | grep "Mem:" | awk '{print "Used: " $3 "/" $2 " (" $3/$2*100 "%)"}' 2>/dev/null || echo "unknown")
        echo "  Memory: $mem_info"
    elif [ -f "/proc/meminfo" ]; then
        local total_mem=$(grep "MemTotal:" /proc/meminfo | awk '{print $2}' || echo "0")
        local free_mem=$(grep "MemAvailable:" /proc/meminfo | awk '{print $2}' || echo "0")
        if [ "$total_mem" != "0" ] && [ "$free_mem" != "0" ]; then
            local used_mem=$((total_mem - free_mem))
            echo "  Memory: ${used_mem}KB used / ${total_mem}KB total"
        fi
    fi
    
    # Load average
    if [ -f "/proc/loadavg" ]; then
        local load=$(cat /proc/loadavg | cut -d' ' -f1-3 || echo "unknown")
        echo "  Load average: $load"
    fi
    
    # Disk usage of current directory
    if command -v df >/dev/null 2>&1; then
        local disk_usage=$(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}' 2>/dev/null || echo "unknown")
        echo "  Disk usage: $disk_usage"
    fi
}

# Function to show project information
show_project_info() {
    echo "Project Information:"
    
    # Package.json version
    if [ -f "package.json" ]; then
        local version=$(grep '"version"' package.json | sed 's/.*"version": *"\([^"]*\)".*/\1/' 2>/dev/null || echo "unknown")
        echo "  Version: $version"
    fi
    
    # Git information
    if [ -d ".git" ]; then
        local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
        local commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
        echo "  Git branch: $branch"
        echo "  Git commit: $commit"
    fi
    
    # Node.js version
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version 2>/dev/null || echo "unknown")
        echo "  Node.js: $node_version"
    fi
    
    # pnpm version
    if command -v pnpm >/dev/null 2>&1; then
        local pnpm_version=$(pnpm --version 2>/dev/null || echo "unknown")
        echo "  pnpm: $pnpm_version"
    fi
    
    # Bun version
    if command -v bun >/dev/null 2>&1; then
        local bun_version=$(bun --version 2>/dev/null || echo "unknown")
        echo "  Bun: $bun_version"
    elif [ -f "$HOME/.bun/bin/bun" ]; then
        local bun_version=$("$HOME/.bun/bin/bun" --version 2>/dev/null || echo "unknown")
        echo "  Bun: $bun_version"
    fi
}

# Function to find related processes
find_related_processes() {
    echo "Related Processes:"
    
    # Find Node.js processes that might be related
    local node_processes=$(pgrep -f "node.*api/cli-generator.js" 2>/dev/null || true)
    if [ -n "$node_processes" ]; then
        echo "  MCP Registry processes found:"
        for pid in $node_processes; do
            local cmd=$(ps -p "$pid" -o args= 2>/dev/null | head -c 80 || echo "unknown")
            echo "    PID $pid: $cmd"
        done
    else
        echo "  No MCP Registry processes found"
    fi
    
    # Check what's using our port
    if is_port_in_use "$PORT"; then
        echo "  Port $PORT is in use by:"
        if command -v lsof >/dev/null 2>&1; then
            lsof -i :"$PORT" 2>/dev/null | sed 's/^/    /' || echo "    (unable to determine)"
        else
            echo "    (lsof not available to determine)"
        fi
    else
        echo "  Port $PORT is not in use"
    fi
}

# Main status function
show_status() {
    print_header "Awesome MCP Registry Server Status"
    echo "=================================================="
    echo
    
    # Check if server is running
    local pid=""
    if pid=$(is_server_running); then
        print_success "🟢 Server is RUNNING"
        echo
        get_process_info "$pid"
        echo
        check_server_health "$PORT"
        echo
    else
        print_error "🔴 Server is NOT RUNNING"
        echo
        
        # Check if port is still in use by something else
        if is_port_in_use "$PORT"; then
            print_warning "Port $PORT is in use by another process"
        fi
    fi
    
    show_log_info
    echo
    
    find_related_processes
    echo
    
    show_project_info
    echo
    
    show_system_info
    echo
    
    # Show quick start commands
    print_header "Quick Commands:"
    if [ -n "$pid" ]; then
        echo "  ./stop.sh          - Stop the server"
        echo "  ./stop.sh --force  - Force stop the server"
        echo "  tail -f $LOG_FILE  - Follow logs"
    else
        echo "  ./start.sh         - Start the server"
        echo "  ./install.sh       - Reinstall/setup"
    fi
    
    echo "  curl http://localhost:$PORT - Test server response"
    echo
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  --watch            Continuously monitor status (refresh every 5 seconds)"
    echo "  --json             Output status in JSON format"
    echo "  --port PORT        Check specific port (default: 3000)"
    echo "  -h, --help         Show this help message"
}

# Function to output JSON status
show_json_status() {
    local pid=""
    local running="false"
    local healthy="false"
    
    if pid=$(is_server_running); then
        running="true"
        if check_server_health "$PORT" >/dev/null 2>&1; then
            healthy="true"
        fi
    fi
    
    local log_exists="false"
    local log_size="0"
    if [ -f "$LOG_FILE" ]; then
        log_exists="true"
        log_size=$(wc -c < "$LOG_FILE" 2>/dev/null || echo "0")
    fi
    
    cat << EOF
{
  "server": {
    "running": $running,
    "healthy": $healthy,
    "pid": "${pid:-null}",
    "port": $PORT
  },
  "log": {
    "exists": $log_exists,
    "file": "$LOG_FILE",
    "size": $log_size
  },
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
}

# Function to watch status continuously
watch_status() {
    while true; do
        clear
        show_status
        print_status "Refreshing in 5 seconds... (Press Ctrl+C to stop)"
        sleep 5
    done
}

# Parse command line arguments
WATCH_MODE="false"
JSON_OUTPUT="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH_MODE="true"
            shift
            ;;
        --json)
            JSON_OUTPUT="true"
            shift
            ;;
        --port)
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
    if [ "$JSON_OUTPUT" = "true" ]; then
        show_json_status
    elif [ "$WATCH_MODE" = "true" ]; then
        watch_status
    else
        show_status
    fi
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi