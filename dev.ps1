# ==============================================================================
# Daycare ERP - Development Environment Manager for Windows (PowerShell)
# Manages PostgreSQL (Docker), .NET Backend, and React/Vite Frontend
# ==============================================================================

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Action = "start",

    [Parameter(Position = 1)]
    [string]$Service = "all"
)

$ErrorActionPreference = "Continue"

# Base directory resolution
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "Daycare"
$FrontendDir = Join-Path $ScriptDir "frontend"
$PidsDir = Join-Path $ScriptDir ".pids"
$LogsDir = Join-Path $ScriptDir "logs"

# Service configuration
$DbContainer = "daycare-postgres"
$DbComposeFile = Join-Path $BackendDir "docker-compose.yml"
$BackendPort = 5107
$FrontendPort = 3001
$DbPort = 5432

# PID file paths
$BackendPidFile = Join-Path $PidsDir "backend.pid"
$FrontendPidFile = Join-Path $PidsDir "frontend.pid"

# Ensure runtime directories exist
if (-not (Test-Path $PidsDir)) { New-Item -ItemType Directory -Path $PidsDir -Force | Out-Null }
if (-not (Test-Path $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir -Force | Out-Null }

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

function Write-Banner {
    Write-Host ""
    Write-Host "  ================================================================" -ForegroundColor Yellow
    Write-Host "                DAYCARE ERP DEV MANAGER (WINDOWS)                 " -ForegroundColor Yellow
    Write-Host "  ================================================================" -ForegroundColor Yellow
    Write-Host ""
}

function Test-PortInUse {
    param ([int]$Port)
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return ($null -ne $conn)
    }
    catch {
        $tcp = New-Object System.Net.Sockets.TcpClient
        try {
            $tcp.Connect("127.0.0.1", $Port)
            $tcp.Close()
            return $true
        }
        catch {
            return $false
        }
    }
}

function Stop-ProcessOnPort {
    param ([int]$Port)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($p in $pids) {
                if ($p -gt 0) {
                    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    catch {
        # Fallback via netstat
        $lines = netstat -ano | Select-String ":$Port\s"
        foreach ($line in $lines) {
            $parts = $line.Line -split '\s+'
            $p = $parts[-1]
            if ($p -match '^\d+$' -and [int]$p -gt 0) {
                Stop-Process -Id [int]$p -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

function Test-ProcessRunning {
    param ([string]$PidFile)
    if (Test-Path $PidFile) {
        $p = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($p -and ($p -match '^\d+$')) {
            $proc = Get-Process -Id [int]$p -ErrorAction SilentlyContinue
            if ($null -ne $proc) {
                return $true
            }
        }
    }
    return $false
}

# ------------------------------------------------------------------------------
# Database Management (Docker)
# ------------------------------------------------------------------------------

function Test-DbRunning {
    try {
        $res = docker ps --format "{{.Names}}" 2>$null
        return ($res -contains $DbContainer)
    }
    catch {
        return $false
    }
}

function Start-Database {
    Write-Host "[>] Starting PostgreSQL Database (Docker)..." -ForegroundColor Cyan
    if (Test-DbRunning) {
        Write-Host "  [OK] Database is already running on port $DbPort." -ForegroundColor Green
        return
    }

    $allContainers = docker ps -a --format "{{.Names}}" 2>$null
    if ($allContainers -contains $DbContainer) {
        docker start $DbContainer | Out-Null
    }
    else {
        docker compose -f $DbComposeFile up -d postgres | Out-Null
    }

    Write-Host -NoNewline "  Waiting for database readiness..."
    for ($i = 0; $i -lt 30; $i++) {
        $ready = docker exec $DbContainer pg_isready -U daycare -d daycare 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK] Ready!" -ForegroundColor Green
            return
        }
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 1
    }
    Write-Host " [!] Database started, but readiness check timed out. Proceeding..." -ForegroundColor Yellow
}

function Stop-Database {
    Write-Host "[*] Stopping PostgreSQL Database (Docker)..." -ForegroundColor Cyan
    if (Test-DbRunning) {
        docker stop $DbContainer | Out-Null
        Write-Host "  [OK] Database stopped." -ForegroundColor Green
    }
    else {
        Write-Host "  Database is already stopped." -ForegroundColor Gray
    }
}

# ------------------------------------------------------------------------------
# Backend Management (.NET)
# ------------------------------------------------------------------------------

function Test-BackendRunning {
    if (Test-PortInUse $BackendPort) { return $true }
    if (Test-ProcessRunning $BackendPidFile) { return $true }
    return $false
}

function Start-Backend {
    Write-Host "[>] Starting .NET Backend API..." -ForegroundColor Cyan

    if (Test-BackendRunning) {
        Write-Host "  [!] Backend is already running on port $BackendPort." -ForegroundColor Yellow
        return
    }

    if (-not (Test-DbRunning)) {
        Write-Host "  Database not running. Starting database first..." -ForegroundColor Gray
        Start-Database
    }

    Stop-ProcessOnPort $BackendPort
    if (Test-Path $BackendPidFile) { Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue }

    Write-Host "  Compiling and launching Daycare.Api..."
    $backendLog = Join-Path $LogsDir "backend.log"
    
    $proc = Start-Process dotnet -ArgumentList "run --project src/Daycare.Api --launch-profile http" `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput $backendLog `
        -RedirectStandardError (Join-Path $LogsDir "backend_err.log") `
        -PassThru -WindowStyle Hidden

    $proc.Id | Out-File -FilePath $BackendPidFile -Encoding ascii -Force

    Write-Host -NoNewline "  Waiting for backend at http://localhost:$BackendPort/swagger..."
    for ($i = 0; $i -lt 40; $i++) {
        if (Test-PortInUse $BackendPort) {
            Write-Host " [OK] Online!" -ForegroundColor Green
            return
        }
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 1
    }

    Write-Host " [!] Backend started in background. Logs: $backendLog" -ForegroundColor Yellow
}

function Stop-Backend {
    Write-Host "[*] Stopping .NET Backend..." -ForegroundColor Cyan
    $stopped = $false

    if (Test-Path $BackendPidFile) {
        $p = Get-Content $BackendPidFile -ErrorAction SilentlyContinue
        if ($p -and ($p -match '^\d+$')) {
            Stop-Process -Id [int]$p -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
        Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
    }

    if (Test-PortInUse $BackendPort) {
        Stop-ProcessOnPort $BackendPort
        $stopped = $true
    }

    if ($stopped) {
        Write-Host "  [OK] Backend stopped (port $BackendPort freed)." -ForegroundColor Green
    }
    else {
        Write-Host "  Backend was not running." -ForegroundColor Gray
    }
}

# ------------------------------------------------------------------------------
# Frontend Management (Vite / React)
# ------------------------------------------------------------------------------

function Test-FrontendRunning {
    if (Test-PortInUse $FrontendPort) { return $true }
    if (Test-ProcessRunning $FrontendPidFile) { return $true }
    return $false
}

function Start-Frontend {
    Write-Host "[>] Starting Frontend (Vite / React)..." -ForegroundColor Cyan

    if (Test-FrontendRunning) {
        Write-Host "  [!] Frontend is already running on port $FrontendPort." -ForegroundColor Yellow
        return
    }

    Stop-ProcessOnPort $FrontendPort
    if (Test-Path $FrontendPidFile) { Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue }

    Write-Host "  Launching Vite dev server..."
    $frontendLog = Join-Path $LogsDir "frontend.log"

    $proc = Start-Process cmd.exe -ArgumentList "/c npm run dev" `
        -WorkingDirectory $FrontendDir `
        -RedirectStandardOutput $frontendLog `
        -RedirectStandardError (Join-Path $LogsDir "frontend_err.log") `
        -PassThru -WindowStyle Hidden

    $proc.Id | Out-File -FilePath $FrontendPidFile -Encoding ascii -Force

    Write-Host -NoNewline "  Waiting for frontend at http://localhost:$FrontendPort..."
    for ($i = 0; $i -lt 30; $i++) {
        if (Test-PortInUse $FrontendPort) {
            Write-Host " [OK] Online!" -ForegroundColor Green
            return
        }
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 1
    }

    Write-Host " [!] Frontend started in background. Logs: $frontendLog" -ForegroundColor Yellow
}

function Stop-Frontend {
    Write-Host "[*] Stopping Frontend..." -ForegroundColor Cyan
    $stopped = $false

    if (Test-Path $FrontendPidFile) {
        $p = Get-Content $FrontendPidFile -ErrorAction SilentlyContinue
        if ($p -and ($p -match '^\d+$')) {
            Stop-Process -Id [int]$p -Force -ErrorAction SilentlyContinue
            $stopped = $true
        }
        Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
    }

    if (Test-PortInUse $FrontendPort) {
        Stop-ProcessOnPort $FrontendPort
        $stopped = $true
    }

    if ($stopped) {
        Write-Host "  [OK] Frontend stopped (port $FrontendPort freed)." -ForegroundColor Green
    }
    else {
        Write-Host "  Frontend was not running." -ForegroundColor Gray
    }
}

# ------------------------------------------------------------------------------
# High-Level Controls
# ------------------------------------------------------------------------------

function Start-AllServices {
    Write-Banner
    Write-Host "Starting all services (Database, Backend, Frontend)..." -ForegroundColor White
    Write-Host ""
    Start-Database
    Write-Host ""
    Start-Backend
    Write-Host ""
    Start-Frontend
    Write-Host ""
    Show-Status
}

function Stop-AllServices {
    Write-Banner
    Write-Host "Stopping all services..." -ForegroundColor White
    Write-Host ""
    Stop-Frontend
    Stop-Backend
    Stop-Database
    Write-Host ""
    Write-Host "[OK] All services have been stopped successfully." -ForegroundColor Green
}

function Restart-Service {
    param ([string]$Target)
    switch ($Target.ToLower()) {
        "frontend" {
            Stop-Frontend
            Start-Sleep -Seconds 1
            Start-Frontend
        }
        "backend" {
            Stop-Backend
            Start-Sleep -Seconds 1
            Start-Backend
        }
        { $_ -in @("db", "postgres", "database") } {
            Stop-Database
            Start-Sleep -Seconds 1
            Start-Database
        }
        default {
            Stop-AllServices
            Start-Sleep -Seconds 1
            Start-AllServices
        }
    }
}

function Show-Status {
    Write-Banner
    Write-Host "CURRENT SERVICES STATUS:" -ForegroundColor White
    Write-Host "----------------------------------------------------------------"

    # Database Status
    if (Test-DbRunning) {
        Write-Host "  Database:   [RUNNING] (Docker: $DbContainer on port $DbPort)" -ForegroundColor Green
    }
    else {
        Write-Host "  Database:   [STOPPED] (Port $DbPort)" -ForegroundColor Red
    }

    # Backend Status
    if (Test-BackendRunning) {
        Write-Host "  Backend:    [RUNNING] (http://localhost:$BackendPort)" -ForegroundColor Green
        Write-Host "              Swagger: http://localhost:$BackendPort/swagger" -ForegroundColor Gray
    }
    else {
        Write-Host "  Backend:    [STOPPED] (Port $BackendPort)" -ForegroundColor Red
    }

    # Frontend Status
    if (Test-FrontendRunning) {
        Write-Host "  Frontend:   [RUNNING] (http://localhost:$FrontendPort)" -ForegroundColor Green
        Write-Host "              Parent Portal: http://localhost:$FrontendPort/parent" -ForegroundColor Gray
    }
    else {
        Write-Host "  Frontend:   [STOPPED] (Port $FrontendPort)" -ForegroundColor Red
    }

    Write-Host "----------------------------------------------------------------"
    Write-Host "  Logs:       $LogsDir" -ForegroundColor Gray
    Write-Host ""
}

function Show-Logs {
    param ([string]$Target)
    switch ($Target.ToLower()) {
        "backend" {
            $log = Join-Path $LogsDir "backend.log"
            Write-Host "Tailing backend logs ($log)... (Ctrl+C to exit)" -ForegroundColor Cyan
            Get-Content -Path $log -Wait -Tail 50
        }
        "frontend" {
            $log = Join-Path $LogsDir "frontend.log"
            Write-Host "Tailing frontend logs ($log)... (Ctrl+C to exit)" -ForegroundColor Cyan
            Get-Content -Path $log -Wait -Tail 50
        }
        { $_ -in @("db", "postgres") } {
            Write-Host "Tailing database docker logs... (Ctrl+C to exit)" -ForegroundColor Cyan
            docker logs -f $DbContainer
        }
        default {
            $bLog = Join-Path $LogsDir "backend.log"
            $fLog = Join-Path $LogsDir "frontend.log"
            Write-Host "Tailing backend and frontend logs... (Ctrl+C to exit)" -ForegroundColor Cyan
            Get-Content -Path @($bLog, $fLog) -Wait -Tail 25
        }
    }
}

function Show-Help {
    Write-Banner
    Write-Host "USAGE:" -ForegroundColor White
    Write-Host "  .\dev.ps1                     Start all services (db, backend, frontend)" -ForegroundColor Green
    Write-Host "  .\dev.ps1 start [service]     Start all or a specific service" -ForegroundColor Green
    Write-Host "  .\dev.ps1 stop [service]      Stop all or a specific service" -ForegroundColor Green
    Write-Host "  .\dev.ps1 restart [service]   Restart all or a specific service" -ForegroundColor Green
    Write-Host "  .\dev.ps1 status              Show status of all services" -ForegroundColor Green
    Write-Host "  .\dev.ps1 logs [service]      View live logs" -ForegroundColor Green
    Write-Host ""
    Write-Host "SERVICES:" -ForegroundColor White
    Write-Host "  backend | frontend | db | all" -ForegroundColor Gray
    Write-Host ""
}

# ------------------------------------------------------------------------------
# Command Routing
# ------------------------------------------------------------------------------

switch ($Action.ToLower()) {
    { $_ -in @("start", "up") } {
        switch ($Service.ToLower()) {
            "backend"  { Start-Backend }
            "frontend" { Start-Frontend }
            { $_ -in @("db", "postgres", "database") } { Start-Database }
            default    { Start-AllServices }
        }
    }
    { $_ -in @("stop", "down") } {
        switch ($Service.ToLower()) {
            "backend"  { Stop-Backend }
            "frontend" { Stop-Frontend }
            { $_ -in @("db", "postgres", "database") } { Stop-Database }
            default    { Stop-AllServices }
        }
    }
    "restart" {
        Restart-Service $Service
    }
    { $_ -in @("status", "ps") } {
        Show-Status
    }
    { $_ -in @("logs", "log") } {
        Show-Logs $Service
    }
    "clean" {
        Write-Host "Cleaning logs and PID tracking files..." -ForegroundColor Cyan
        Stop-AllServices
        Get-ChildItem -Path $LogsDir | Remove-Item -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path $PidsDir | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Cleaned!" -ForegroundColor Green
    }
    { $_ -in @("help", "-h", "--help") } {
        Show-Help
    }
    default {
        Write-Host "[!] Unknown command: $Action" -ForegroundColor Red
        Write-Host ""
        Show-Help
        exit 1
    }
}
