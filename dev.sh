#!/usr/bin/env bash
# ==============================================================================
# Daycare ERP — Development Environment Manager
# Manages PostgreSQL (Docker), .NET Backend, and React/Vite Frontend
# ==============================================================================

set -e

# Base directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/Daycare"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PIDS_DIR="$SCRIPT_DIR/.pids"
LOGS_DIR="$SCRIPT_DIR/logs"

# Service configuration
DB_CONTAINER="daycare-postgres"
DB_COMPOSE_FILE="$BACKEND_DIR/docker-compose.yml"
BACKEND_PORT=5107
FRONTEND_PORT=3001
DB_PORT=5432

# PID file paths
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"

# Colors for terminal output
BOLD='\033[1m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Ensure directories exist
mkdir -p "$PIDS_DIR" "$LOGS_DIR"

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

print_banner() {
    echo -e "${BOLD}${AMBER}"
    echo "  ╔════════════════════════════════════════════════════════════╗"
    echo "  ║            ☀️  DAYCARE ERP DEV MANAGER ☀️                 ║"
    echo "  ╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

is_port_in_use() {
    local port="$1"
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:"$port" >/dev/null 2>&1
    elif command -v fuser >/dev/null 2>&1; then
        fuser "$port"/tcp >/dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -lptn "sport = :$port" | grep -q ":$port"
    else
        return 1
    fi
}

kill_port_process() {
    local port="$1"
    if command -v fuser >/dev/null 2>&1; then
        fuser -k -9 "${port}/tcp" >/dev/null 2>&1 || true
    fi
    if command -v lsof >/dev/null 2>&1; then
        local pids
        pids=$(lsof -ti:"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs -r kill -9 >/dev/null 2>&1 || true
        fi
    fi
}

is_process_running() {
    local pid_file="$1"
    if [ -f "$pid_file" ]; then
        local pid
        pid=$(cat "$pid_file" 2>/dev/null || true)
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# ------------------------------------------------------------------------------
# Database Management (Docker)
# ------------------------------------------------------------------------------

is_db_running() {
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
        return 0
    fi
    return 1
}

start_db() {
    echo -e "${CYAN}▶ Starting PostgreSQL Database (Docker)...${NC}"
    if is_db_running; then
        echo -e "  ${GREEN}✓ Database is already running on port ${DB_PORT}.${NC}"
        return 0
    fi

    # Check if container exists in stopped state
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$"; then
        docker start "$DB_CONTAINER" >/dev/null 2>&1
    else
        docker compose -f "$DB_COMPOSE_FILE" up -d postgres >/dev/null 2>&1
    fi

    # Wait for database readiness
    echo -n "  Waiting for database to be ready..."
    for i in {1..30}; do
        if docker exec "$DB_CONTAINER" pg_isready -U daycare -d daycare >/dev/null 2>&1; then
            echo -e " ${GREEN}✓ Ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    echo -e " ${AMBER}! Database started, but readiness check timed out. Proceeding...${NC}"
}

stop_db() {
    echo -e "${CYAN}■ Stopping PostgreSQL Database (Docker)...${NC}"
    if is_db_running; then
        docker stop "$DB_CONTAINER" >/dev/null 2>&1 || true
        echo -e "  ${GREEN}✓ Database stopped.${NC}"
    else
        echo -e "  ${GRAY}Database is already stopped.${NC}"
    fi
}

# ------------------------------------------------------------------------------
# Backend Management (.NET)
# ------------------------------------------------------------------------------

is_backend_running() {
    if is_port_in_use "$BACKEND_PORT"; then
        return 0
    fi
    if is_process_running "$BACKEND_PID_FILE"; then
        return 0
    fi
    return 1
}

start_backend() {
    echo -e "${CYAN}▶ Starting .NET Backend API...${NC}"

    if is_backend_running; then
        echo -e "  ${AMBER}! Backend is already running on port ${BACKEND_PORT}.${NC}"
        return 0
    fi

    # Ensure DB is started first
    if ! is_db_running; then
        echo -e "  ${GRAY}Database not detected. Launching database first...${NC}"
        start_db
    fi

    # Clean any stale port listener
    kill_port_process "$BACKEND_PORT"
    rm -f "$BACKEND_PID_FILE"

    echo -e "  Compiling and launching Daycare.Api..."
    cd "$BACKEND_DIR"
    setsid dotnet run --project src/Daycare.Api --launch-profile http </dev/null > "$LOGS_DIR/backend.log" 2>&1 &
    local dotnet_pid=$!
    disown "$dotnet_pid" 2>/dev/null || true
    echo "$dotnet_pid" > "$BACKEND_PID_FILE"
    cd "$SCRIPT_DIR"

    # Wait for backend to respond
    echo -n "  Waiting for backend at http://localhost:${BACKEND_PORT}/api/hello..."
    for i in {1..40}; do
        if curl -s -f "http://localhost:${BACKEND_PORT}/api/hello" >/dev/null 2>&1 || is_port_in_use "$BACKEND_PORT"; then
            local actual_pid=$(lsof -ti:"$BACKEND_PORT" 2>/dev/null | head -n 1 || true)
            [ -n "$actual_pid" ] && echo "$actual_pid" > "$BACKEND_PID_FILE"
            echo -e " ${GREEN}✓ Online!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    echo -e " ${AMBER}! Backend started in background. Logs: $LOGS_DIR/backend.log${NC}"
}

stop_backend() {
    echo -e "${CYAN}■ Stopping .NET Backend...${NC}"
    local stopped=0

    if [ -f "$BACKEND_PID_FILE" ]; then
        local pid
        pid=$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)
        if [ -n "$pid" ]; then
            pkill -P "$pid" 2>/dev/null || true
            kill -9 "$pid" 2>/dev/null || true
            stopped=1
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # Ensure port is completely freed
    if is_port_in_use "$BACKEND_PORT"; then
        kill_port_process "$BACKEND_PORT"
        stopped=1
    fi

    if [ "$stopped" -eq 1 ]; then
        echo -e "  ${GREEN}✓ Backend stopped (port ${BACKEND_PORT} freed).${NC}"
    else
        echo -e "  ${GRAY}Backend was not running.${NC}"
    fi
}

# ------------------------------------------------------------------------------
# Frontend Management (Vite / React)
# ------------------------------------------------------------------------------

is_frontend_running() {
    if is_port_in_use "$FRONTEND_PORT"; then
        return 0
    fi
    if is_process_running "$FRONTEND_PID_FILE"; then
        return 0
    fi
    return 1
}

start_frontend() {
    echo -e "${CYAN}▶ Starting Frontend (Vite / React)...${NC}"

    if is_frontend_running; then
        echo -e "  ${AMBER}! Frontend is already running on port ${FRONTEND_PORT}.${NC}"
        return 0
    fi

    # Clean any stale port listener
    kill_port_process "$FRONTEND_PORT"
    rm -f "$FRONTEND_PID_FILE"

    echo -e "  Launching Vite dev server..."
    cd "$FRONTEND_DIR"
    setsid npm run dev </dev/null > "$LOGS_DIR/frontend.log" 2>&1 &
    local npm_pid=$!
    disown "$npm_pid" 2>/dev/null || true
    echo "$npm_pid" > "$FRONTEND_PID_FILE"
    cd "$SCRIPT_DIR"

    # Wait for frontend port
    echo -n "  Waiting for frontend at http://localhost:${FRONTEND_PORT}..."
    for i in {1..30}; do
        if is_port_in_use "$FRONTEND_PORT"; then
            local actual_pid=$(lsof -ti:"$FRONTEND_PORT" 2>/dev/null | head -n 1 || true)
            [ -n "$actual_pid" ] && echo "$actual_pid" > "$FRONTEND_PID_FILE"
            echo -e " ${GREEN}✓ Online!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    echo -e " ${AMBER}! Frontend started in background. Logs: $LOGS_DIR/frontend.log${NC}"
}

stop_frontend() {
    echo -e "${CYAN}■ Stopping Frontend...${NC}"
    local stopped=0

    if [ -f "$FRONTEND_PID_FILE" ]; then
        local pid
        pid=$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)
        if [ -n "$pid" ]; then
            pkill -P "$pid" 2>/dev/null || true
            kill -9 "$pid" 2>/dev/null || true
            stopped=1
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    # Ensure port is completely freed
    if is_port_in_use "$FRONTEND_PORT"; then
        kill_port_process "$FRONTEND_PORT"
        stopped=1
    fi

    if [ "$stopped" -eq 1 ]; then
        echo -e "  ${GREEN}✓ Frontend stopped (port ${FRONTEND_PORT} freed).${NC}"
    else
        echo -e "  ${GRAY}Frontend was not running.${NC}"
    fi
}

# ------------------------------------------------------------------------------
# Combined Start / Stop / Status / Restart
# ------------------------------------------------------------------------------

start_all() {
    print_banner
    echo -e "${BOLD}Starting all services (Database, Backend, Frontend)...${NC}\n"
    start_db
    echo ""
    start_backend
    echo ""
    start_frontend
    echo ""
    show_status
}

stop_all() {
    print_banner
    echo -e "${BOLD}Stopping all services...${NC}\n"
    stop_frontend
    stop_backend
    stop_db
    echo -e "\n${GREEN}✓ All services have been stopped successfully.${NC}"
}

restart_service() {
    local target="$1"
    case "$target" in
        frontend)
            stop_frontend
            sleep 1
            start_frontend
            ;;
        backend)
            stop_backend
            sleep 1
            start_backend
            ;;
        db|postgres|database)
            stop_db
            sleep 1
            start_db
            ;;
        all|"")
            stop_all
            sleep 1
            start_all
            ;;
        *)
            echo -e "${RED}Unknown service: $target${NC}"
            echo "Options: frontend | backend | db | all"
            exit 1
            ;;
    esac
}

show_status() {
    print_banner
    echo -e "${BOLD}CURRENT SERVICES STATUS:${NC}"
    echo "────────────────────────────────────────────────────────────────"

    # Database Status
    if is_db_running; then
        echo -e "  Database:   ${GREEN}● RUNNING${NC}  (Docker: ${DB_CONTAINER} on port ${DB_PORT})"
    else
        echo -e "  Database:   ${RED}○ STOPPED${NC}  (Port ${DB_PORT})"
    fi

    # Backend Status
    if is_backend_running; then
        local b_pid=$(lsof -ti:"$BACKEND_PORT" 2>/dev/null | head -n 1 || true)
        [ -z "$b_pid" ] && [ -f "$BACKEND_PID_FILE" ] && b_pid=$(cat "$BACKEND_PID_FILE")
        echo -e "  Backend:    ${GREEN}● RUNNING${NC}  (PID: ${b_pid:-active}, http://localhost:${BACKEND_PORT})"
        echo -e "              ${GRAY}Swagger Docs: http://localhost:${BACKEND_PORT}/swagger${NC}"
    else
        echo -e "  Backend:    ${RED}○ STOPPED${NC}  (Port ${BACKEND_PORT})"
    fi

    # Frontend Status
    if is_frontend_running; then
        local f_pid=$(lsof -ti:"$FRONTEND_PORT" 2>/dev/null | head -n 1 || true)
        [ -z "$f_pid" ] && [ -f "$FRONTEND_PID_FILE" ] && f_pid=$(cat "$FRONTEND_PID_FILE")
        echo -e "  Frontend:   ${GREEN}● RUNNING${NC}  (PID: ${f_pid:-active}, http://localhost:${FRONTEND_PORT})"
        echo -e "              ${GRAY}Parent Portal: http://localhost:${FRONTEND_PORT}/parent${NC}"
    else
        echo -e "  Frontend:   ${RED}○ STOPPED${NC}  (Port ${FRONTEND_PORT})"
    fi

    echo "────────────────────────────────────────────────────────────────"
    echo -e "  Logs:       ${GRAY}$LOGS_DIR/${NC}"
    echo ""
}

show_logs() {
    local target="$1"
    case "$target" in
        backend)
            echo -e "${CYAN}Tailing backend logs ($LOGS_DIR/backend.log)... (Ctrl+C to exit)${NC}"
            tail -f "$LOGS_DIR/backend.log"
            ;;
        frontend)
            echo -e "${CYAN}Tailing frontend logs ($LOGS_DIR/frontend.log)... (Ctrl+C to exit)${NC}"
            tail -f "$LOGS_DIR/frontend.log"
            ;;
        db|postgres)
            echo -e "${CYAN}Tailing postgres docker logs... (Ctrl+C to exit)${NC}"
            docker logs -f "$DB_CONTAINER"
            ;;
        all|"")
            echo -e "${CYAN}Tailing all logs... (Ctrl+C to exit)${NC}"
            tail -f "$LOGS_DIR/backend.log" "$LOGS_DIR/frontend.log" 2>/dev/null || true
            ;;
        *)
            echo -e "${RED}Unknown service for logs: $target${NC}"
            echo "Options: backend | frontend | db | all"
            exit 1
            ;;
    esac
}

show_help() {
    print_banner
    echo -e "${BOLD}USAGE:${NC}"
    echo -e "  ${GREEN}./dev.sh${NC}                     Start all services (db, backend, frontend)"
    echo -e "  ${GREEN}./dev.sh start [service]${NC}     Start all or a specific service"
    echo -e "  ${GREEN}./dev.sh stop [service]${NC}      Stop all or a specific service"
    echo -e "  ${GREEN}./dev.sh restart [service]${NC}   Restart all or a specific service"
    echo -e "  ${GREEN}./dev.sh status${NC}              Show status of all services"
    echo -e "  ${GREEN}./dev.sh logs [service]${NC}        View live logs (tail -f)"
    echo ""
    echo -e "${BOLD}INDIVIDUAL SERVICE CONTROLS:${NC}"
    echo -e "  ./dev.sh start frontend      Start only Vite frontend"
    echo -e "  ./dev.sh stop frontend       Stop only Vite frontend"
    echo -e "  ./dev.sh restart frontend    Restart only Vite frontend"
    echo ""
    echo -e "  ./dev.sh start backend       Start only .NET backend"
    echo -e "  ./dev.sh stop backend        Stop only .NET backend"
    echo -e "  ./dev.sh restart backend     Restart only .NET backend"
    echo ""
    echo -e "  ./dev.sh start db            Start only PostgreSQL docker container"
    echo -e "  ./dev.sh stop db             Stop only PostgreSQL docker container"
    echo -e "  ./dev.sh restart db          Restart only PostgreSQL docker container"
    echo ""
    echo -e "${BOLD}LOGS:${NC}"
    echo -e "  ./dev.sh logs backend        Tail backend logs"
    echo -e "  ./dev.sh logs frontend       Tail frontend logs"
    echo -e "  ./dev.sh logs db             Tail postgres docker logs"
    echo ""
}

# ------------------------------------------------------------------------------
# Command Routing
# ------------------------------------------------------------------------------

ACTION="${1:-start}"
SERVICE="${2:-}"

case "$ACTION" in
    start|up)
        case "$SERVICE" in
            backend)  start_backend ;;
            frontend) start_frontend ;;
            db|postgres|database) start_db ;;
            all|"")   start_all ;;
            *)
                echo -e "${RED}Unknown service to start: $SERVICE${NC}"
                echo "Usage: ./dev.sh start [backend|frontend|db|all]"
                exit 1
                ;;
        esac
        ;;

    stop|down)
        case "$SERVICE" in
            backend)  stop_backend ;;
            frontend) stop_frontend ;;
            db|postgres|database) stop_db ;;
            all|"")   stop_all ;;
            *)
                echo -e "${RED}Unknown service to stop: $SERVICE${NC}"
                echo "Usage: ./dev.sh stop [backend|frontend|db|all]"
                exit 1
                ;;
        esac
        ;;

    stop-backend)
        stop_backend
        ;;

    stop-frontend)
        stop_frontend
        ;;

    stop-db|stop-postgres)
        stop_db
        ;;

    start-backend)
        start_backend
        ;;

    start-frontend)
        start_frontend
        ;;

    start-db|start-postgres)
        start_db
        ;;

    restart)
        restart_service "$SERVICE"
        ;;

    status|ps)
        show_status
        ;;

    logs|log)
        show_logs "$SERVICE"
        ;;

    clean)
        echo -e "${CYAN}Cleaning logs and PIDs...${NC}"
        stop_all
        rm -rf "$LOGS_DIR"/* "$PIDS_DIR"/*
        echo -e "${GREEN}✓ Cleaned!${NC}"
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        echo -e "${RED}Unknown command: $ACTION${NC}\n"
        show_help
        exit 1
        ;;
esac
