# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of QUAMC system
- Document management with version control
- Multi-level approval workflow (Coordinator → Dean → Director)
- Role-based access control (Admin, Director, Dean, Coordinators)
- Area and sub-area management
- Program management and tracking
- Accreditation cycle management
- Activity logging and audit trail
- Export and reporting functionality
- Real-time notifications
- Docker containerization support
- Service layer architecture
- Policy-based authorization
- API resources for data transformation

### Changed
- Refactored controllers to use service layer
- Organized controllers into Admin and User folders
- Separated form requests into Admin and User namespaces
- Improved code organization and maintainability

### Security
- Implemented comprehensive authorization policies
- Added form request validation
- Secure file upload handling
- SQL injection prevention through Eloquent ORM

## [1.0.0] - 2024-XX-XX

### Added
- Initial stable release

[Unreleased]: https://github.com/yourusername/quamc/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/quamc/releases/tag/v1.0.0
