# QUAMC - Quality Assurance and Accreditation Management System

A comprehensive web-based system for managing quality assurance and accreditation processes in educational institutions.

## Overview

QUAMC (Quality Assurance and Accreditation Management Committee) is a Laravel-based application designed to streamline the accreditation documentation process, evidence management, and workflow coordination between different stakeholders including deans, coordinators, and directors.

## Features

- **Document Management**: Upload, version control, and approval workflow for accreditation evidence
- **Role-Based Access Control**: Separate interfaces for Admin, Dean, Program Coordinators, Area Coordinators, and Directors
- **Area & Sub-Area Management**: Organize accreditation requirements by areas and sub-areas
- **Approval Workflow**: Multi-level approval process (Coordinator → Dean → Director)
- **Program Management**: Track multiple academic programs and their accreditation status
- **Accreditation Cycles**: Manage different accreditation periods and deadlines
- **Activity Logging**: Comprehensive audit trail of all system activities
- **Export & Reporting**: Generate reports and export documentation
- **Real-time Notifications**: Keep stakeholders informed of status changes

## Technology Stack

- **Backend**: Laravel 12.x (PHP 8.4)
- **Frontend**: React with Inertia.js, TypeScript
- **Database**: MySQL 8.0
- **Caching**: Redis
- **Vector Search**: Qdrant
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## Architecture

The application follows clean architecture principles with:

- **Service Layer**: Business logic separated from controllers
- **Repository Pattern**: Data access abstraction
- **Policy-Based Authorization**: Centralized permission management
- **API Resources**: Consistent data transformation
- **Form Requests**: Validation logic separation

## Quick Start

### Prerequisites

- PHP 8.4 or higher
- Composer
- Node.js 20.x or higher
- MySQL 8.0 or higher
- Redis (optional, for caching)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quamc.git
   cd quamc
   ```

2. Install dependencies:
   ```bash
   composer install
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Update `.env` with your database credentials

5. Run migrations and seeders:
   ```bash
   php artisan migrate --seed
   ```

6. Build frontend assets:
   ```bash
   npm run build
   ```

7. Start the development server:
   ```bash
   php artisan serve
   npm run dev
   ```

8. Access the application at `http://localhost:8000`

## Docker Deployment

For containerized deployment, see [Docker Setup Guide](docs/DOCKER.md)

```bash
# Quick start with Docker
docker-compose up -d
./docker-setup.sh
```

Qdrant is now part of the Docker stack for scalable RAG retrieval. The service is exposed on `http://localhost:6333`.

## Project Structure

```
quamc/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/          # Admin-only controllers
│   │   │   └── User/           # User-facing controllers
│   │   ├── Requests/
│   │   │   ├── Admin/          # Admin request validation
│   │   │   └── User/           # User request validation
│   │   └── Resources/          # API resources for data transformation
│   ├── Models/                 # Eloquent models
│   ├── Policies/               # Authorization policies
│   └── Services/               # Business logic layer
├── database/
│   ├── migrations/             # Database migrations
│   └── seeders/                # Database seeders
├── resources/
│   ├── js/                     # React/TypeScript frontend
│   └── css/                    # Stylesheets
├── docs/                       # Documentation
└── docker/                     # Docker configuration
```

## User Roles

- **Admin**: System administration and user management
- **Director**: QUAMC Director with full oversight and final approval authority
- **Dean**: Program-level oversight and approval
- **Program Coordinator**: Manage program-wide documentation
- **Area Coordinator**: Manage specific area documentation

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Docker Setup](docs/DOCKER.md)
- [API Documentation](docs/API.md)
- [User Guide](docs/USER_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT.md)

## Development

### Running Tests

```bash
php artisan test
```

### Code Style

```bash
# PHP CS Fixer
composer format

# ESLint
npm run lint
```

### Database

```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Create new migration
php artisan make:migration create_table_name
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

If you discover any security-related issues, please email security@example.com instead of using the issue tracker.

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions, please contact:
- Email: support@example.com
- Documentation: [docs/](docs/)

## Acknowledgments

- Laravel Framework
- Inertia.js
- React
- Tailwind CSS
