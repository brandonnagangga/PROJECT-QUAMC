# Installation Guide

This guide provides detailed instructions for installing and setting up the QUAMC application.

## System Requirements

### Minimum Requirements

- PHP 8.4 or higher
- Composer 2.x
- Node.js 20.x or higher
- npm or yarn
- MySQL 8.0 or higher
- 2GB RAM minimum
- 10GB disk space

### Recommended Requirements

- PHP 8.4 with OPcache enabled
- 4GB RAM or more
- SSD storage
- Redis for caching

### Required PHP Extensions

- BCMath
- Ctype
- Fileinfo
- JSON
- Mbstring
- OpenSSL
- PDO
- PDO_MySQL
- Tokenizer
- XML
- GD
- Zip
- Intl

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/quamc.git
cd quamc
```

### 2. Install PHP Dependencies

```bash
composer install
```

For production:
```bash
composer install --no-dev --optimize-autoloader
```

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Generate application key:
```bash
php artisan key:generate
```

Edit `.env` and configure:

```env
APP_NAME=QUAMC
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_quamc
DB_USERNAME=your_username
DB_PASSWORD=your_password

CACHE_STORE=redis
QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

### 5. Database Setup

Create the database:
```bash
mysql -u root -p
CREATE DATABASE db_quamc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Run migrations:
```bash
php artisan migrate
```

Seed the database:
```bash
php artisan db:seed
```

### 6. Storage Setup

Create symbolic link for storage:
```bash
php artisan storage:link
```

Set proper permissions:
```bash
chmod -R 775 storage bootstrap/cache
```

### 7. Build Frontend Assets

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
```

### 8. Start the Application

Development server:
```bash
php artisan serve
```

The application will be available at `http://localhost:8000`

## Post-Installation

### 1. Create Admin User

```bash
php artisan tinker
```

```php
$user = App\Models\User::create([
    'id' => (string) Str::uuid(),
    'name' => 'Admin User',
    'email' => 'admin@example.com',
    'password' => Hash::make('password'),
    'is_active' => true,
]);

$adminRole = App\Models\Role::where('slug', 'admin')->first();
$user->roles()->attach($adminRole->id);
```

### 2. Configure Queue Worker (Optional)

For background jobs:
```bash
php artisan queue:work
```

Or use Supervisor for production (see docs/DEPLOYMENT.md)

### 3. Configure Scheduler (Optional)

Add to crontab:
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### 4. Clear and Cache Configuration

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Verification

### Check Installation

```bash
php artisan about
```

### Run Tests

```bash
php artisan test
```

### Access the Application

1. Navigate to `http://localhost:8000`
2. Login with your admin credentials
3. Verify all features are working

## Troubleshooting

### Permission Issues

```bash
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### Database Connection Issues

- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check MySQL user permissions

### Asset Build Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Cache Issues

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

## Next Steps

- [Docker Setup](DOCKER.md) - For containerized deployment
- [Development Guide](DEVELOPMENT.md) - For development workflow
- [User Guide](USER_GUIDE.md) - For end-user documentation
