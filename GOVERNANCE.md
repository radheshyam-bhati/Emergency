# Governance

## Current model

Rapid Rescue Grid is maintainer-led. The maintainer is responsible for:

- roadmap and release decisions,
- reviewing and merging pull requests,
- security triage and disclosure coordination,
- community moderation,
- dependency and infrastructure maintenance.

## Decisions

Small changes are decided in pull requests. Larger changes should start as an
issue with a short design note covering motivation, alternatives, security and
privacy impact, and a migration plan.

Consensus is preferred. If consensus is not reached, the maintainer makes the
final decision and documents the rationale.

## Roles

- **Maintainer:** merge access, release access, security response.
- **Contributor:** anyone who opens an issue or pull request.
- **Reviewer:** a trusted contributor invited to review specific areas.

Roles are earned through sustained, constructive contributions and may be
revoked for Code of Conduct or security violations.

## Releases

- Semantic Versioning (`MAJOR.MINOR.PATCH`).
- Changelog entries for user-facing changes.
- Security fixes may be released without a major version bump.
- Release notes are generated from merged pull requests and curated before
  publishing.

## Security

Security reports follow [SECURITY.md](SECURITY.md). Do not discuss unresolved
vulnerabilities in public issues.

## Changes to this document

Governance changes require a pull request and maintainer approval.
