# Roadmap

This roadmap is directional, not a promise. Prioritization follows security,
correctness, and contributor experience.

## Now — security baseline (`v0.1.0`)

- [ ] Purge exposed database/WAL from Git history and GitHub caches
- [ ] Rotate exposed credentials and notify affected users
- [ ] Keep public signup dispatcher-only
- [x] Make demo seeding development-only
- [x] Isolate tests from the real database
- [ ] Remediate critical/high dependency vulnerabilities
- [ ] Enable secret scanning, push protection, CodeQL, and branch protection
- [x] Add CI, CodeQL, and Dependabot workflows
- [x] Add license, community files, and security policy

## Next — open-source launch (`v0.2.0`)

- [ ] Host a working demo (static frontend + API)
- [ ] Move JWT to HttpOnly cookies with CSRF protection
- [ ] Add structured logging, request IDs, and readiness checks
- [ ] Make dispatch assignment atomic under concurrency
- [ ] Fix N+1 reads and add missing indexes
- [ ] Add loading/error/empty states and auth-aware polling
- [ ] Add E2E tests and coverage thresholds
- [ ] Publish `v0.1.0` with release notes

## Later — production readiness (`v0.3.0`)

- [ ] PostgreSQL and versioned migrations
- [ ] Real-time transport (SSE/WebSocket) or event bus
- [ ] Backups, restore drills, and disaster recovery
- [ ] MFA, account recovery, and audit-log export
- [ ] Accessibility and browser-support audit
- [ ] Load testing and performance budgets
- [ ] SBOM, signed releases, and OpenSSF Scorecard
- [ ] Privacy/compliance review for any real-data use case

## Out of scope for now

- Real emergency dispatch or medical advice
- Processing real patient data
- Multi-tenant SaaS billing
- Mobile-native applications
