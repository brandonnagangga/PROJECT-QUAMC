@echo off
echo 🐳 Setting up QUAMC Docker Environment...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Copy environment file
if not exist .env (
    echo 📝 Creating .env file from .env.docker...
    copy .env.docker .env
    echo ⚠️  Please update .env with your configuration (especially APP_KEY and DB credentials)
) else (
    echo ✅ .env file already exists
)

REM Build and start containers
echo 🏗️  Building Docker containers...
docker-compose build

echo 🚀 Starting Docker containers...
docker-compose up -d

REM Wait for MySQL to be ready
echo ⏳ Waiting for MySQL to be ready...
timeout /t 10 /nobreak >nul

REM Generate application key if not set
echo 🔑 Generating application key...
docker-compose exec app php artisan key:generate

REM Run migrations
echo 📊 Running database migrations...
docker-compose exec app php artisan migrate --force

REM Seed database (optional)
set /p seed="Do you want to seed the database? (y/n): "
if /i "%seed%"=="y" (
    echo 🌱 Seeding database...
    docker-compose exec app php artisan db:seed --force
)

REM Create storage link
echo 🔗 Creating storage link...
docker-compose exec app php artisan storage:link

REM Set permissions
echo 🔒 Setting permissions...
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chmod -R 755 /var/www/html/storage

REM Build frontend assets
echo 🎨 Building frontend assets...
docker-compose run --rm node npm install
docker-compose run --rm node npm run build

REM Clear and cache config
echo 🧹 Clearing and caching configuration...
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache

echo.
echo ✅ Docker setup complete!
echo.
echo 📍 Your application is running at: http://localhost:8000
echo 📍 MySQL is accessible at: localhost:3307
echo 📍 Redis is accessible at: localhost:6380
echo.
echo Useful commands:
echo   - View logs: docker-compose logs -f
echo   - Stop containers: docker-compose down
echo   - Restart containers: docker-compose restart
echo   - Run artisan commands: docker-compose exec app php artisan [command]
echo.
pause
