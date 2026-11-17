# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Open-source community files, issue/PR templates, and CI workflows.
- Environment validation and configurable SQLite path.
- CORS allowlist, security headers, rate limiting, generic error handling, and
  readiness endpoint.
- Temporary-database test setup.
- Deployment, architecture, API, development, and data-disclaimer docs.

### Changed

- Public signup always creates a dispatcher account.
- Demo seeding is development-only and uses configurable demo credentials.
- Seed data uses synthetic hospital names.
- Authentication uses asynchronous bcrypt and a pinned JWT algorithm.
- Activity log limits are bounded.

### Security

- Removed the tracked SQLite database from the current tree.
- Added ignore rules for runtime databases and local package caches.

### Fixed

- `npm run db:seed` now runs when invoked through `tsx`.
- Tests no longer reset the real `server/data` database.
- API client supports `VITE_API_URL` and request timeouts.

## [0.1.0] - TBD

Initial public alpha. See the GitHub milestone
`v0.1.0 — Security baseline`.
