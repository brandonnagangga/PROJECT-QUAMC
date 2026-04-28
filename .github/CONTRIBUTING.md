# Contributing to QUAMC

Thank you for considering contributing to QUAMC! This document outlines the process and guidelines for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- Clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, PHP version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- Clear and descriptive title
- Detailed description of the proposed feature
- Explanation of why this enhancement would be useful
- Possible implementation approach

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Update documentation
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Development Process

### Setting Up Development Environment

See [DEVELOPMENT.md](../docs/DEVELOPMENT.md) for detailed setup instructions.

### Coding Standards

- Follow PSR-12 for PHP code
- Use TypeScript for frontend code
- Write meaningful commit messages
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for high test coverage

```bash
php artisan test
```

### Documentation

- Update README.md if needed
- Add inline code documentation
- Update relevant documentation in docs/

## Commit Message Guidelines

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(documents): add bulk upload functionality

fix(auth): resolve login redirect issue

docs(readme): update installation instructions

refactor(services): extract document service layer
```

## Review Process

1. Automated tests must pass
2. Code review by maintainers
3. Address review feedback
4. Approval from at least one maintainer
5. Merge to main branch

## Questions?

Feel free to open an issue for questions or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
