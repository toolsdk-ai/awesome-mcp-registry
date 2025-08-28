#!/bin/bash

# Awesome MCP Registry - Installation Script
# This script automates the complete setup of the Awesome MCP Registry

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js $NODE_VERSION detected (✓)"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Minimum required: 18.x"
            return 1
        fi
    else
        print_error "Node.js not found"
        return 1
    fi
}

# Function to install Node.js (macOS)
install_node_macos() {
    print_status "Installing Node.js via Homebrew..."
    if command_exists brew; then
        brew install node
    else
        print_error "Homebrew not found. Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
}

# Function to install Node.js (Linux)
install_node_linux() {
    print_status "Installing Node.js..."
    if command_exists apt-get; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command_exists yum; then
        curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
        sudo yum install -y nodejs
    else
        print_error "Package manager not supported. Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
}

# Function to install pnpm
install_pnpm() {
    print_status "Installing pnpm..."
    npm install -g pnpm
    print_success "pnpm installed successfully"
}

# Function to install Bun
install_bun() {
    print_status "Installing Bun runtime..."
    curl -fsSL https://bun.sh/install | bash
    
    # Add Bun to PATH for current session
    export PATH="$HOME/.bun/bin:$PATH"
    
    # Add to shell profile
    if [ -f "$HOME/.bashrc" ]; then
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    if [ -f "$HOME/.zshrc" ]; then
        echo 'export PATH="$HOME/.bun/bin:$PATH"' >> "$HOME/.zshrc"
    fi
    
    print_success "Bun installed successfully"
}

# Function to build project safely (without MCP client testing)
build_project_safe() {
    # Add Bun to PATH if not already available
    if ! command_exists bun; then
        export PATH="$HOME/.bun/bin:$PATH"
    fi
    
    print_status "Running safe build steps..."
    
    print_status "7/7 Running linter and build..."
    pnpm run build
    
    print_warning "Skipped MCP client testing to avoid installation errors"
    print_status "To run full validation later: bun scripts/test-mcp-clients.ts"
}

# Function to setup project
setup_project() {
    print_status "Setting up Awesome MCP Registry..."
    
    # Install dependencies
    print_status "Installing project dependencies..."
    pnpm install
    
    # Build the project
    print_status "Building the project..."
    if command_exists make; then
        # Use a modified make command that skips MCP client testing
        make build-safe || {
            print_warning "Make build failed, trying manual build without testing..."
            build_project_safe
        }
    else
        print_warning "Make not found, running build steps manually..."
        build_project_safe
    fi
    
    print_success "Project built successfully"
}

# Function to setup MeiliSearch (optional)
setup_meilisearch() {
    print_status "Setting up MeiliSearch for enhanced search..."
    
    if command_exists docker; then
        print_status "Docker detected. You can use: docker run -d -p 7700:7700 getmeili/meilisearch:v1.10"
    elif command_exists brew && [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Installing MeiliSearch via Homebrew..."
        brew install meilisearch
        print_success "MeiliSearch installed. Run: meilisearch --env development --no-analytics"
    elif command_exists curl; then
        print_status "Installing MeiliSearch binary..."
        curl -L https://install.meilisearch.com | sh
        chmod +x meilisearch
        print_success "MeiliSearch binary downloaded. Run: ./meilisearch --env development --no-analytics"
    else
        print_warning "Could not install MeiliSearch automatically"
        print_status "Please install manually from: https://www.meilisearch.com/docs/learn/getting_started/quick_start"
    fi
    
    print_status "After starting MeiliSearch, run these commands to set up search:"
    echo "  npm run search:init"
    echo "  npm run search:index"
}

# Function to create service files
create_service_files() {
    print_status "Making shell scripts executable..."
    chmod +x start.sh 2>/dev/null || true
    chmod +x stop.sh 2>/dev/null || true
    chmod +x status.sh 2>/dev/null || true
    chmod +x install.sh 2>/dev/null || true
}

# Main installation process
main() {
    print_status "Starting Awesome MCP Registry installation..."
    echo
    
    # Detect OS
    OS="unknown"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_status "Detected: macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_status "Detected: Linux"
    else
        print_warning "Unsupported OS: $OSTYPE"
    fi
    
    # Check and install Node.js
    if ! check_node_version; then
        print_status "Node.js installation required..."
        if [ "$OS" = "macos" ]; then
            install_node_macos
        elif [ "$OS" = "linux" ]; then
            install_node_linux
        else
            print_error "Please install Node.js 18+ manually from https://nodejs.org/"
            exit 1
        fi
    fi
    
    # Check and install pnpm
    if ! command_exists pnpm; then
        install_pnpm
    else
        print_success "pnpm already installed (✓)"
    fi
    
    # Check and install Bun
    if ! command_exists bun && [ ! -f "$HOME/.bun/bin/bun" ]; then
        install_bun
    else
        print_success "Bun already installed (✓)"
    fi
    
    # Setup the project
    setup_project
    
    # Create service files
    create_service_files
    
    # Ask about MeiliSearch setup
    echo
    print_status "Would you like to set up MeiliSearch for enhanced search? (y/N)"
    read -r setup_search
    if [[ "$setup_search" =~ ^[Yy]$ ]]; then
        setup_meilisearch
    else
        print_status "Skipping MeiliSearch setup. You can set it up later using docs/SEARCH.md"
    fi
    
    echo
    print_success "🎉 Installation completed successfully!"
    echo
    print_status "Next steps:"
    echo "  1. Run './start.sh' to start the server"
    echo "  2. Run './status.sh' to check server status"
    echo "  3. Run './stop.sh' to stop the server"
    echo "  4. Visit http://localhost:3000 to access the web interface"
    if [[ "$setup_search" =~ ^[Yy]$ ]]; then
        echo "  5. Start MeiliSearch and run 'npm run search:index' for enhanced search"
    fi
    echo
    print_status "For more information, see INSTALL.md and docs/SEARCH.md"
}

# Run main function
main "$@"