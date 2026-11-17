# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| `0.1.x` | Yes |
| `< 0.1` | No |

## Reporting a vulnerability

Please **do not open a public issue** for a security vulnerability.

Use GitHub private vulnerability reporting:

https://github.com/radheshyam-bhati/VAGRHUB/security/advisories/new

If private reporting is unavailable, contact the maintainer privately through
the contact method on their GitHub profile.

Include:

- affected version or commit,
- reproduction steps,
- impact and attack preconditions,
- any suggested fix,
- whether the issue is already public.

Do not include real patient data, personal information, credentials, tokens,
or database contents in a report. If you encounter exposed data, report it
privately and do not download or redistribute it.

## Response targets

- Acknowledgement: within 48 hours
- Initial triage: within 5 business days
- Critical fix target: within 7 days
- High fix target: within 30 days

These are targets, not guarantees. The project is maintainer-led and does not
currently offer a bug bounty.

## Scope

In scope:

- Authentication and authorization flaws
- API input handling and injection
- Data exposure and privacy issues
- Dependency and supply-chain vulnerabilities
- CI/CD and release integrity
- Denial-of-service issues caused by application logic

Out of scope:

- Social engineering
- Physical attacks
- Denial-of-service against third-party services
- Reports requiring real patient data or production credentials
- Vulnerabilities in third-party services without a project-specific impact

## Safe harbor

Good-faith research that follows this policy will not be pursued legally. Do
not access, modify, or exfiltrate data beyond what is necessary to demonstrate
the issue. Do not disrupt the service or other users.

## Data and privacy

Rapid Rescue Grid is a simulation project. Do not submit real patient data,
real credentials, or personal health information. If you encounter exposed
data, report it privately and do not download, copy, or redistribute it.

## Security expectations for contributors

- Never commit `.env`, databases, tokens, or credentials.
- Use synthetic data in tests and demos.
- Treat authentication, authorization, and data-access changes as
  security-sensitive.
- Keep dependencies patched and review Dependabot alerts.
