@echo off
REM RiseUp Docker Setup Script for Windows

echo.
echo ========================================
echo   RiseUp Fintech Platform - Setup
echo ========================================
echo.

REM Check for Docker
echo Checking for Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker is installed

REM Check for Docker Compose
echo Checking for Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not installed
    echo Please upgrade Docker Desktop to include Compose v2
    pause
    exit /b 1
)
echo [OK] Docker Compose is installed

REM Check for Git
echo Checking for Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Git is not installed
    echo GitHub push will need to be done manually
    echo Install Git from: https://git-scm.com/download/win
) else (
    echo [OK] Git is installed
)

REM Copy environment files
echo.
echo Setting up environment files...
if not exist ".env" (
    copy ".env.example" ".env" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Created .env file
    ) else (
        echo [WARNING] Could not create .env file
    )
) else (
    echo [OK] .env file already exists
)

if not exist "telegram-bot\.env" (
    copy "telegram-bot\.env.example" "telegram-bot\.env" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Created telegram-bot\.env file
    ) else (
        echo [WARNING] Could not create telegram-bot\.env file
    )
) else (
    echo [OK] telegram-bot\.env file already exists
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Edit .env file with your configuration:
echo    - Database password
echo    - JWT secret
echo    - Telegram bot token (already set)
echo.
echo 2. Start development services:
echo    docker-compose -f docker/docker-compose.dev.yml up --build
echo.
echo 3. Start production services:
echo    docker-compose -f docker/docker-compose.prod.yml up -d
echo.
echo 4. Access points:
echo    - Frontend: http://localhost:5173 (dev) or http://localhost (prod)
echo    - Backend: http://localhost:3001
echo    - Database GUI: http://localhost:8080
echo.
echo 5. Push to GitHub (requires Git):
echo    git init
echo    git add .
echo    git commit -m "initial commit"
echo    git branch -M main
echo    git remote add origin https://github.com/yevgenevic/RiseUp.git
echo    git push -u origin main
echo.
echo For more information, see DEPLOYMENT_GUIDE.md
echo.
pause
