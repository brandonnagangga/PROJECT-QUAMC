# QUAMC Docker Setup Guide

This guide will help you run the QUAMC application using Docker containers.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- At least 4GB of available RAM

## Quick Start

### Windows

1. Open PowerShell or Command Prompt as Administrator
2. Navigate to the project directory
3. Run the setup script:
   ```bash
   docker-setup.bat
   ```

### Linux/Mac

1. Open Terminal
2. Navigate to the project directory
3. Make the setup script executable:
   ```bash
   chmod +x docker-setup.sh
   ```
4. Run the setup script:
   ```bash
   ./docker-setup.sh
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Copy Environment File

```bash
cp .env.docker .env
```

Edit `.env` and update:
- `APP_KEY` (will be generated automatically)
- `DB_PASSWORD` (change from default)
- Other configuration as needed

### 2. Build and Start Containers

```bash
docker-compose build
docker-compose up -d
```

### 3. Generate Application Key

```bash
docker-compose exec app php artisan key:generate
```

### 4. Run Migrations

```bash
docker-compose exec app php artisan migrate --force
```

### 5. Seed Database (Optional)

```bash
docker-compose exec app php artisan db:seed --force
```

### 6. Create Storage Link

```bash
docker-compose exec app php artisan storage:link
```

### 7. Build Frontend Assets

```bash
docker-compose run --rm node npm install
docker-compose run --rm node npm run build
```

### 8. Cache Configuration

```bash
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

## Accessing the Application

- **Application**: http://localhost:8000
- **MySQL**: localhost:3307
  - Username: `quamc_user` (or as configured in .env)
  - Password: `secure_password_here` (or as configured in .env)
  - Database: `db_quamc`
- **Redis**: localhost:6380
- **Qdrant**: http://localhost:6333

## Useful Docker Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f db
```

### Stop Containers

```bash
docker-compose down
```

### Restart Containers

```bash
docker-compose restart
```

### Run Artisan Commands

```bash
docker-compose exec app php artisan [command]

# Examples:
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan queue:work
```

### Access Container Shell

```bash
# PHP container
docker-compose exec app bash

# MySQL container
docker-compose exec db mysql -u quamc_user -p db_quamc
```

### Rebuild Containers

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Container Structure

- **app**: PHP 8.4-FPM container running Laravel
- **nginx**: Nginx web server
- **db**: MySQL 8.0 database
- **node**: Node.js for building frontend assets
- **redis**: Redis for caching and queues
- **qdrant**: Vector database for RAG retrieval

## Volumes

- `db-data`: Persistent MySQL data
- `qdrant-data`: Persistent Qdrant vector data
- `./storage`: Application storage (uploads, logs, cache)
- `./`: Application code (mounted for development)

## Troubleshooting

### Port Already in Use

If port 8000, 3307, or 6380 is already in use, edit `docker-compose.yml` and change the port mappings:

```yaml
ports:
  - "8001:80"  # Change 8000 to 8001
```

### Permission Issues

```bash
docker-compose exec app chown -R www-data:www-data /var/www/html/storage
docker-compose exec app chmod -R 755 /var/www/html/storage
```

### Database Connection Issues

1. Check if MySQL container is running:
   ```bash
   docker-compose ps
   ```

2. Check MySQL logs:
   ```bash
   docker-compose logs db
   ```

3. Verify `.env` database credentials match `docker-compose.yml`

### Clear All Caches

```bash
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan route:clear
docker-compose exec app php artisan view:clear
```

## Production Deployment

For production deployment:

1. Update `.env`:
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Use strong passwords
   - Configure proper mail settings

2. Use production-optimized docker-compose:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. Enable HTTPS with SSL certificates

4. Set up proper backup strategy for database and storage

## Stopping and Removing Everything

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (⚠️ This will delete database data)
docker-compose down -v

# Remove all images
docker-compose down --rmi all
```

## Support

For issues or questions, please refer to the main project documentation or contact the development team.
