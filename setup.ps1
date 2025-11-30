#!/usr/bin/env pwsh
<#
.SYNOPSIS
    RiseUp Fintech Platform - Docker Setup Script
.DESCRIPTION
    Validates Docker installation and sets up environment files for local development
.EXAMPLE
    .\setup.ps1
#>

param()

# Colors for output
$SuccessColor = "Green"
$ErrorColor = "Red"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

Write-Host ""
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host "  RiseUp Fintech Platform - Setup" -ForegroundColor $InfoColor
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host ""

# Check for Docker
Write-Host "Checking for Docker installation..." -ForegroundColor $InfoColor
try {
    $dockerVersion = & docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker is installed: $dockerVersion" -ForegroundColor $SuccessColor
    }
}
catch {
    Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor $ErrorColor
    Write-Host "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor $WarningColor
    exit 1
}

# Check for Docker Compose
Write-Host "Checking for Docker Compose..." -ForegroundColor $InfoColor
try {
    $composeVersion = & docker-compose --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Docker Compose is installed: $composeVersion" -ForegroundColor $SuccessColor
    }
}
catch {
    Write-Host "[ERROR] Docker Compose is not installed" -ForegroundColor $ErrorColor
    Write-Host "Please upgrade Docker Desktop to include Compose v2" -ForegroundColor $WarningColor
    exit 1
}

# Check for Git
Write-Host "Checking for Git installation..." -ForegroundColor $InfoColor
try {
    $gitVersion = & git --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Git is installed: $gitVersion" -ForegroundColor $SuccessColor
        $gitInstalled = $true
    }
}
catch {
    Write-Host "[WARNING] Git is not installed" -ForegroundColor $WarningColor
    Write-Host "GitHub push will need to be done manually" -ForegroundColor $WarningColor
    Write-Host "Install Git from: https://git-scm.com/download/win" -ForegroundColor $WarningColor
    $gitInstalled = $false
}

# Setup environment files
Write-Host ""
Write-Host "Setting up environment files..." -ForegroundColor $InfoColor

if (-not (Test-Path ".env")) {
    try {
        Copy-Item ".env.example" ".env" -ErrorAction Stop
        Write-Host "[OK] Created .env file" -ForegroundColor $SuccessColor
        Write-Host "     Edit .env with your configuration (database password, JWT secret, etc.)" -ForegroundColor $WarningColor
    }
    catch {
        Write-Host "[WARNING] Could not create .env file: $_" -ForegroundColor $WarningColor
    }
}
else {
    Write-Host "[OK] .env file already exists" -ForegroundColor $SuccessColor
}

if (-not (Test-Path "telegram-bot\.env")) {
    try {
        Copy-Item "telegram-bot\.env.example" "telegram-bot\.env" -ErrorAction Stop
        Write-Host "[OK] Created telegram-bot\.env file" -ForegroundColor $SuccessColor
    }
    catch {
        Write-Host "[WARNING] Could not create telegram-bot\.env file: $_" -ForegroundColor $WarningColor
    }
}
else {
    Write-Host "[OK] telegram-bot\.env file already exists" -ForegroundColor $SuccessColor
}

# Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host "  Setup Complete!" -ForegroundColor $SuccessColor
Write-Host "========================================" -ForegroundColor $InfoColor
Write-Host ""

Write-Host "Next steps:" -ForegroundColor $InfoColor
Write-Host ""
Write-Host "1. Edit .env file with your configuration:" -ForegroundColor $InfoColor
Write-Host "   - Database password" -ForegroundColor "Gray"
Write-Host "   - JWT secret" -ForegroundColor "Gray"
Write-Host "   - Telegram bot token (already set)" -ForegroundColor "Gray"
Write-Host ""

Write-Host "2. Start development services:" -ForegroundColor $InfoColor
Write-Host "   docker-compose -f docker/docker-compose.dev.yml up --build" -ForegroundColor "Gray"
Write-Host ""

Write-Host "3. Start production services:" -ForegroundColor $InfoColor
Write-Host "   docker-compose -f docker/docker-compose.prod.yml up -d" -ForegroundColor "Gray"
Write-Host ""

Write-Host "4. Access points:" -ForegroundColor $InfoColor
Write-Host "   Frontend (dev):     http://localhost:5173" -ForegroundColor "Gray"
Write-Host "   Frontend (prod):    http://localhost" -ForegroundColor "Gray"
Write-Host "   Backend API:        http://localhost:3001" -ForegroundColor "Gray"
Write-Host "   Database GUI:       http://localhost:8080" -ForegroundColor "Gray"
Write-Host ""

if ($gitInstalled) {
    Write-Host "5. Push to GitHub:" -ForegroundColor $InfoColor
    Write-Host "   git init" -ForegroundColor "Gray"
    Write-Host "   git add ." -ForegroundColor "Gray"
    Write-Host "   git commit -m 'initial commit'" -ForegroundColor "Gray"
    Write-Host "   git branch -M main" -ForegroundColor "Gray"
    Write-Host "   git remote add origin https://github.com/yevgenevic/RiseUp.git" -ForegroundColor "Gray"
    Write-Host "   git push -u origin main" -ForegroundColor "Gray"
}
else {
    Write-Host "5. Install Git to push to GitHub:" -ForegroundColor $WarningColor
    Write-Host "   https://git-scm.com/download/win" -ForegroundColor "Gray"
    Write-Host "   Then run the git commands above" -ForegroundColor "Gray"
}

Write-Host ""
Write-Host "For more information, see DEPLOYMENT_GUIDE.md" -ForegroundColor $InfoColor
Write-Host ""
