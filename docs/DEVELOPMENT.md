# Development Guide

This guide covers the development workflow, coding standards, and best practices for contributing to QUAMC.

## Development Environment Setup

### Prerequisites

- Git
- PHP 8.4+
- Composer
- Node.js 20+
- MySQL 8.0+
- Redis (optional)
- IDE (VS Code, PHPStorm recommended)

### Initial Setup

1. Clone and install:
   ```bash
   git clone https://github.com/yourusername/quamc.git
   cd quamc
   composer install
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Setup database:
   ```bash
   php artisan migrate:fresh --seed
   ```

4. Start development servers:
   ```bash
   # Terminal 1: Laravel
   php artisan serve
   
   # Terminal 2: Vite
   npm run dev
   ```

## Project Architecture

### Directory Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/              # Admin controllers
│   │   └── User/               # User controllers
│   ├── Requests/
│   │   ├── Admin/              # Admin form requests
│   │   └── User/               # User form requests
│   └── Resources/              # API resources
├── Models/                     # Eloquent models
├── Policies/                   # Authorization policies
├── Services/                   # Business logic layer
├── Events/                     # Event classes
└── Jobs/                       # Queue jobs
```

### Architecture Layers

1. **Controllers**: Handle HTTP requests, delegate to services
2. **Services**: Business logic and orchestration
3. **Repositories**: Data access (if needed)
4. **Policies**: Authorization logic
5. **Resources**: Data transformation for responses
6. **Requests**: Validation logic

## Coding Standards

### PHP (PSR-12)

```php
<?php

namespace App\Services;

use App\Models\Document;

class DocumentService
{
    public function createDocument(array $data): Document
    {
        // Implementation
    }
}
```

### TypeScript/React

```typescript
interface DocumentProps {
    id: number;
    title: string;
}

export const DocumentCard: React.FC<DocumentProps> = ({ id, title }) => {
    return <div>{title}</div>;
};
```

### Naming Conventions

- **Controllers**: `PascalCase` + `Controller` suffix (e.g., `DocumentController`)
- **Services**: `PascalCase` + `Service` suffix (e.g., `DocumentService`)
- **Models**: `PascalCase` singular (e.g., `Document`)
- **Variables**: `camelCase` (e.g., `$documentData`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- **Database tables**: `snake_case` plural (e.g., `documents`)

## Development Workflow

### Creating a New Feature

1. **Create a branch**:
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Create migration**:
   ```bash
   php artisan make:migration create_table_name
   ```

3. **Create model with relationships**:
   ```bash
   php artisan make:model ModelName
   ```

4. **Create service**:
   ```bash
   # Manually create in app/Services/
   ```

5. **Create policy**:
   ```bash
   php artisan make:policy ModelPolicy --model=Model
   ```

6. **Create form requests**:
   ```bash
   php artisan make:request StoreModelRequest
   php artisan make:request UpdateModelRequest
   ```

7. **Create controller**:
   ```bash
   php artisan make:controller Admin/ModelController
   ```

8. **Create resource**:
   ```bash
   php artisan make:resource ModelResource
   ```

9. **Add routes** in `routes/web.php`

10. **Create frontend components** in `resources/js/`

### Testing

Run all tests:
```bash
php artisan test
```

Run specific test:
```bash
php artisan test --filter=DocumentTest
```

Create new test:
```bash
php artisan make:test DocumentTest
```

### Database

Fresh migration:
```bash
php artisan migrate:fresh --seed
```

Create seeder:
```bash
php artisan make:seeder DocumentSeeder
```

### Frontend Development

Build for development:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Type checking:
```bash
npm run type-check
```

Linting:
```bash
npm run lint
```

## Best Practices

### Controllers

- Keep controllers thin
- Delegate business logic to services
- Use form requests for validation
- Use policies for authorization

```php
public function store(StoreDocumentRequest $request)
{
    $this->authorize('create', Document::class);
    
    $document = $this->documentService->createDocument(
        $request->validated(),
        $request->file('file'),
        $request->user()
    );
    
    return back()->with('success', 'Document created.');
}
```

### Services

- Single responsibility
- Return models or collections
- Handle business logic
- Throw exceptions for errors

```php
public function createDocument(array $data, UploadedFile $file, User $user): Document
{
    $path = $file->store('documents');
    
    $document = Document::create([
        'title' => $data['title'],
        'file_path' => $path,
        'uploaded_by' => $user->id,
    ]);
    
    event(new DocumentCreated($document));
    
    return $document;
}
```

### Policies

- One method per action
- Return boolean
- Keep logic simple

```php
public function create(User $user): bool
{
    return $user->hasRole(['admin', 'coordinator']);
}
```

### Resources

- Transform data consistently
- Hide sensitive information
- Use conditional attributes

```php
public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'created_at' => $this->created_at->format('Y-m-d'),
        'user' => new UserResource($this->whenLoaded('user')),
    ];
}
```

## Git Workflow

### Commit Messages

Follow conventional commits:

```
feat: add document approval workflow
fix: resolve file upload issue
docs: update installation guide
refactor: extract document service
test: add document controller tests
```

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/what-changed` - Code refactoring
- `docs/what-documented` - Documentation

### Pull Request Process

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Create pull request
6. Code review
7. Merge to main

## Debugging

### Laravel Telescope

Install for local development:
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

Access at: `http://localhost:8000/telescope`

### Debug Bar

```bash
composer require barryvdh/laravel-debugbar --dev
```

### Logging

```php
Log::info('Document created', ['id' => $document->id]);
Log::error('Upload failed', ['error' => $e->getMessage()]);
```

## Performance

### Optimization

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### Database Optimization

- Use eager loading to avoid N+1 queries
- Add indexes to frequently queried columns
- Use database transactions for multiple operations

```php
// Good: Eager loading
$documents = Document::with('user', 'versions')->get();

// Bad: N+1 query
$documents = Document::all();
foreach ($documents as $doc) {
    echo $doc->user->name; // Queries for each document
}
```

## Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Inertia.js Documentation](https://inertiajs.com)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
