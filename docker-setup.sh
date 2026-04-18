#!/bin/bash

echo "Setting up QUAMC Docker Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    echo "[INFO] Creating .env file from .env.docker..."
    cp .env.docker .env
    echo "[WARNING] Please update .env with your configuration (especially APP_KEY and DB credentials)"
else
    echo "[OK] .env file already exists"
fi

# Build and start containers
echo "[INFO] Building Docker containers..."
docker-compose build

echo "[INFO] Starting Docker containers..."
docker-compose up -d

# Wait for MySQL to be ready
echo "[INFO] Waiting for MySQL to be ready..."
sleep 10

# Generate application key if not set
echo "[INFO] Generating application key..."
docker-compose exec app php artisan key:generate

# Run migrations
echo "[INFO] Running database migrations..."
docker-compose exec app php artisan migrate --force

# Seed database (optional)
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "[INFO] Seeding database..."
    docker-compose exec app php artisan db:seed --force
fi

# Create storage link
echo "[INFO] Creating storage link..."
docker-compose exec app php artisan storage:link

# Set permissions
echo "[INFO] Setting permissions..."
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chmod -R 755 /var/www/html/storage

# Build frontend assets
echo "[INFO] Building frontend assets..."
docker-compose run --rm node npm install
docker-compose run --rm node npm run build

# Clear and cache config
echo "[INFO] Clearing and caching configuration..."
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache

echo ""
echo "[SUCCESS] Docker setup complete!"
echo ""
echo "Your application is running at: http://localhost:8000"
echo "MySQL is accessible at: localhost:3307"
echo "Redis is accessible at: localhost:6380"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop containers: docker-compose down"
echo "  - Restart containers: docker-compose restart"
echo "  - Run artisan commands: docker-compose exec app php artisan [command]"
echo ""
