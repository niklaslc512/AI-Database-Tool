@echo off
chcp 65001 >nul
setlocal

echo === AI数据库管理系统 - 数据库初始化 ===
echo.

REM 检查Node.js环境
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js 22
    pause
    exit /b 1
)

REM 检查npm环境
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到npm，请确保npm已正确安装
    pause
    exit /b 1
)

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

echo 📁 项目根目录: %PROJECT_ROOT%
echo.

REM 进入后端目录
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
if not exist "%BACKEND_DIR%" (
    echo ❌ 错误: 后端目录不存在: %BACKEND_DIR%
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"
echo 🚀 切换到后端目录: %BACKEND_DIR%

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 安装后端依赖...
    npm install
    if errorlevel 1 (
        echo ❌ 安装后端依赖失败
        pause
        exit /b 1
    )
    echo ✓ 后端依赖安装完成
) else (
    echo ✓ 后端依赖已安装
)

REM 编译TypeScript（检查）
echo 🔧 编译TypeScript代码...
npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript编译检查失败
    pause
    exit /b 1
)

REM 运行数据库初始化脚本
echo 💾 运行数据库初始化...
npx ts-node init-database.ts
if errorlevel 1 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)

echo.
echo 🎉 数据库初始化完成！
echo.
echo 📝 下一步操作:
echo   1. 使用 'npm run dev' 启动开发服务器
echo   2. 访问前端页面进行登录测试
echo   3. 及时修改默认用户密码
echo.

pause