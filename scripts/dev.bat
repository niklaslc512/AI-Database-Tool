@echo off
setlocal enabledelayedexpansion

REM AI数据库管理系统开发环境启动脚本 (Windows版本)

echo =======================================
echo   AI数据库管理系统 - 开发环境启动
echo =======================================
echo.

REM 检查Node.js版本
:check_node
echo [INFO] 检查Node.js版本...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js未安装，请先安装Node.js 22+
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('node --version') do (
    set "major_version=%%a"
    set "major_version=!major_version:v=!"
)

if !major_version! lss 22 (
    echo [ERROR] Node.js版本过低，需要v22.0.0或更高版本
    node --version
    exit /b 1
)

echo [SUCCESS] Node.js版本检查通过
node --version

REM 检查npm版本
:check_npm
echo [INFO] 检查npm版本...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm未安装
    exit /b 1
)

for /f "tokens=1 delims=." %%a in ('npm --version') do (
    set "npm_major=%%a"
)

if !npm_major! lss 10 (
    echo [ERROR] npm版本过低，需要v10.0.0或更高版本
    npm --version
    exit /b 1
)

echo [SUCCESS] npm版本检查通过
npm --version

REM 根据参数执行相应操作
if "%1"=="install" goto install
if "%1"=="start" goto start
if "%1"=="build" goto build
if "%1"=="check" goto check
if "%1"=="clean" goto clean
goto usage

:install
echo [INFO] 初始化项目...

REM 创建必要的目录
echo [INFO] 创建必要的目录...
if not exist "backend\data" mkdir backend\data
if not exist "backend\logs" mkdir backend\logs
if not exist "backend\uploads" mkdir backend\uploads
if not exist "frontend\dist" mkdir frontend\dist
echo [SUCCESS] 目录创建完成

REM 设置环境变量文件
echo [INFO] 设置环境变量文件...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env"
        echo [SUCCESS] 已创建后端.env文件，请根据需要修改配置
    ) else (
        echo [WARNING] 未找到backend\.env.example文件
    )
) else (
    echo [INFO] 后端.env文件已存在
)

if not exist "frontend\.env" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env"
        echo [SUCCESS] 已创建前端.env文件，请根据需要修改配置
    ) else (
        echo [WARNING] 未找到frontend\.env.example文件
    )
) else (
    echo [INFO] 前端.env文件已存在
)

REM 安装后端依赖
echo [INFO] 安装后端依赖...
cd backend
if exist "package-lock.json" (
    npm ci
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo [ERROR] 后端依赖安装失败
    exit /b 1
)
cd ..
echo [SUCCESS] 后端依赖安装完成

REM 安装前端依赖
echo [INFO] 安装前端依赖...
cd frontend
if exist "package-lock.json" (
    npm ci
) else (
    npm install
)
if %errorlevel% neq 0 (
    echo [ERROR] 前端依赖安装失败
    exit /b 1
)
cd ..
echo [SUCCESS] 前端依赖安装完成

echo [SUCCESS] 项目初始化完成！运行 'dev.bat start' 启动开发服务器
goto end

:start
echo [INFO] 启动开发服务器...

REM 启动后端开发服务器
echo [INFO] 启动后端开发服务器...
cd backend
start /b cmd /c "npm run dev"
cd ..

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 启动前端开发服务器
echo [INFO] 启动前端开发服务器...
cd frontend
start /b cmd /c "npm run dev"
cd ..

echo [SUCCESS] 开发服务器启动完成！
echo [INFO] 后端服务: http://localhost:3000
echo [INFO] 前端服务: http://localhost:5173
echo.
echo [INFO] 按任意键退出...
pause >nul
goto end

:build
echo [INFO] 构建项目...

REM 构建后端
echo [INFO] 构建后端...
cd backend
npm run build
if %errorlevel% neq 0 (
    echo [ERROR] 后端构建失败
    exit /b 1
)
cd ..

echo [SUCCESS] 项目构建完成
goto end

:check
echo [INFO] 检查服务状态...

REM 检查后端服务
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 后端服务运行正常
) else (
    echo [WARNING] 后端服务可能未启动或有问题
)

REM 检查前端服务
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] 前端服务运行正常
) else (
    echo [WARNING] 前端服务可能未启动或有问题
)
goto end

:clean
echo [INFO] 清理项目...
if exist "backend\node_modules" rmdir /s /q "backend\node_modules"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"
if exist "backend\dist" rmdir /s /q "backend\dist"
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "backend\logs" del /q "backend\logs\*.*"
echo [SUCCESS] 项目清理完成
goto end

:usage
echo 用法: %0 {install^|start^|build^|check^|clean}
echo.
echo 命令说明:
echo   install  - 初始化项目，安装依赖
echo   start    - 启动开发服务器
echo   build    - 构建项目
echo   check    - 检查服务状态
echo   clean    - 清理项目文件
goto end

:end
endlocal