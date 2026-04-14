#!/bin/bash

# Windsurf Complete Removal Script for macOS
# This script removes all traces of Windsurf from your system

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running with appropriate permissions
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for user-level operations."
        error "Run it as a regular user. It will prompt for password when needed."
        exit 1
    fi
}

# Function to kill Windsurf processes
kill_windsurf_processes() {
    log "Step 1: Killing all running Windsurf processes..."
    
    # Find and kill Windsurf processes
    local processes=("Windsurf" "windsurf" "Code" "code" "electron")
    
    for proc in "${processes[@]}"; do
        local pids=$(pgrep -if "$proc" | grep -v "$$" || true)
        if [[ -n "$pids" ]]; then
            info "Found $proc processes: $pids"
            echo "$pids" | xargs -r kill -TERM 2>/dev/null || true
            sleep 2
            # Force kill if still running
            echo "$pids" | xargs -r kill -KILL 2>/dev/null || true
        fi
    done
    
    # Kill any processes using Windsurf-related ports
    local ports=(3000 3001 8080 9229 9222)
    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$pid" ]]; then
            info "Killing process using port $port: $pid"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 1
            kill -KILL "$pid" 2>/dev/null || true
        fi
    done
    
    log "All Windsurf processes terminated"
}

# Function to remove application bundle
remove_app_bundle() {
    log "Step 2: Removing Windsurf application bundle..."
    
    local app_paths=(
        "/Applications/Windsurf.app"
        "/Applications/Windsurf Beta.app"
        "/Applications/Windsurf Nightly.app"
        "$HOME/Applications/Windsurf.app"
        "$HOME/Applications/Windsurf Beta.app"
        "$HOME/Applications/Windsurf Nightly.app"
    )
    
    for app_path in "${app_paths[@]}"; do
        if [[ -d "$app_path" ]]; then
            info "Removing: $app_path"
            rm -rf "$app_path"
        fi
    done
    
    log "Application bundle removal completed"
}

# Function to clean user Library files
clean_user_library() {
    log "Step 3: Cleaning user Library caches and preferences..."
    
    local library_paths=(
        "$HOME/Library/Application Support/Windsurf"
        "$HOME/Library/Application Support/Windsurf Beta"
        "$HOME/Library/Application Support/Windsurf Nightly"
        "$HOME/Library/Caches/Windsurf"
        "$HOME/Library/Caches/Windsurf Beta"
        "$HOME/Library/Caches/Windsurf Nightly"
        "$HOME/Library/Caches/com.windsurf.Windsurf"
        "$HOME/Library/Caches/com.windsurf.WindsurfBeta"
        "$HOME/Library/Preferences/Windsurf"
        "$HOME/Library/Preferences/Windsurf Beta"
        "$HOME/Library/Preferences/Windsurf Nightly"
        "$HOME/Library/Preferences/com.windsurf.Windsurf.plist"
        "$HOME/Library/Preferences/com.windsurf.WindsurfBeta.plist"
        "$HOME/Library/Saved Application State/com.windsurf.Windsurf.savedState"
        "$HOME/Library/Saved Application State/com.windsurf.WindsurfBeta.savedState"
        "$HOME/Library/WebKit/com.windsurf.Windsurf"
        "$HOME/Library/WebKit/com.windsurf.WindsurfBeta"
    )
    
    for path in "${library_paths[@]}"; do
        if [[ -e "$path" ]]; then
            info "Removing: $path"
            rm -rf "$path"
        fi
    done
    
    log "User Library cleanup completed"
}

# Function to remove system-level files
remove_system_files() {
    log "Step 4: Removing system-level Windsurf files..."
    
    # These require sudo access
    local system_paths=(
        "/Library/Application Support/Windsurf"
        "/Library/Caches/Windsurf"
        "/Library/Preferences/Windsurf"
        "/Library/LaunchDaemons/com.windsurf.*"
        "/usr/local/bin/windsurf"
        "/usr/local/bin/windsurf-beta"
        "/opt/windsurf"
    )
    
    # Find and expand wildcard patterns
    for path_pattern in "${system_paths[@]}"; do
        for path in $path_pattern; do
            if [[ -e "$path" ]]; then
                info "Removing system files: $path"
                sudo rm -rf "$path" 2>/dev/null || warn "Could not remove $path (may not exist or need different permissions)"
            fi
        done
    done
    
    log "System-level file removal completed"
}

# Function to clean temporary files and logs
clean_temp_files() {
    log "Step 5: Cleaning temporary files and logs..."
    
    local temp_paths=(
        "/tmp/Windsurf*"
        "/tmp/windsurf*"
        "/var/log/Windsurf*"
        "/var/log/windsurf*"
        "$HOME/.windsurf*"
        "$HOME/.vscode*"  # VS Code related files that Windsurf might use
        "/tmp/.com.windsurf.*"
    )
    
    for path_pattern in "${temp_paths[@]}"; do
        for path in $path_pattern; do
            if [[ -e "$path" ]]; then
                info "Removing: $path"
                rm -rf "$path"
            fi
        done
    done
    
    # Clean any remaining Windsurf-related processes in /tmp
    find /tmp -name "*windsurf*" -type f -delete 2>/dev/null || true
    find /tmp -name "*Windsurf*" -type f -delete 2>/dev/null || true
    
    log "Temporary files and logs cleanup completed"
}

# Function to remove any remaining processes or services
cleanup_remaining() {
    log "Step 6: Removing any remaining Windsurf processes or services..."
    
    # Check for any remaining processes
    local remaining_processes=$(ps aux | grep -i windsurf | grep -v grep | grep -v "$$" || true)
    if [[ -n "$remaining_processes" ]]; then
        warn "Found remaining Windsurf processes:"
        echo "$remaining_processes"
        info "Attempting to terminate remaining processes..."
        ps aux | grep -i windsurf | grep -v grep | awk '{print $2}' | xargs -r kill -KILL 2>/dev/null || true
    fi
    
    # Remove any launch agents or daemons
    local launch_agents=(
        "$HOME/Library/LaunchAgents/com.windsurf.*"
        "/Library/LaunchAgents/com.windsurf.*"
        "/Library/LaunchDaemons/com.windsurf.*"
    )
    
    for agent_pattern in "${launch_agents[@]}"; do
        for agent in $agent_pattern; do
            if [[ -f "$agent" ]]; then
                info "Unloading and removing: $agent"
                launchctl unload "$agent" 2>/dev/null || true
                rm -f "$agent"
            fi
        done
    done
    
    log "Remaining processes and services cleanup completed"
}

# Function to verify complete removal
verify_removal() {
    log "Step 7: Verifying complete removal..."
    
    local found_issues=false
    
    # Check for remaining processes
    local processes=$(ps aux | grep -i windsurf | grep -v grep || true)
    if [[ -n "$processes" ]]; then
        warn "Found remaining Windsurf processes:"
        echo "$processes"
        found_issues=true
    fi
    
    # Check for remaining files
    local check_paths=(
        "/Applications/Windsurf"
        "$HOME/Library/Application Support/Windsurf"
        "$HOME/.windsurf"
    )
    
    for path in "${check_paths[@]}"; do
        if [[ -e "$path" ]]; then
            warn "Found remaining Windsurf files: $path"
            found_issues=true
        fi
    done
    
    # Check for remaining launch agents
    local agents=$(find "$HOME/Library/LaunchAgents" /Library/LaunchAgents /Library/LaunchDaemons -name "*windsurf*" -o -name "*Windsurf*" 2>/dev/null || true)
    if [[ -n "$agents" ]]; then
        warn "Found remaining launch agents:"
        echo "$agents"
        found_issues=true
    fi
    
    if [[ "$found_issues" == false ]]; then
        log "✅ Windsurf has been completely removed from your system!"
    else
        warn "⚠️  Some Windsurf components may still be present. Manual cleanup may be required."
    fi
}

# Main execution
main() {
    log "Starting Windsurf complete removal process..."
    log "This script will remove all traces of Windsurf from your system."
    
    # Ask for confirmation
    echo
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Aborted by user."
        exit 0
    fi
    
    # Execute all removal steps
    check_permissions
    kill_windsurf_processes
    remove_app_bundle
    clean_user_library
    remove_system_files
    clean_temp_files
    cleanup_remaining
    verify_removal
    
    log "Windsurf removal process completed!"
    log "You may want to restart your computer to ensure all changes take effect."
}

# Run main function
main "$@"
