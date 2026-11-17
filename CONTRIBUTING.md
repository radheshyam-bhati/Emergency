# Contributing to Rapid Rescue Grid

Thanks for your interest in improving Rapid Rescue Grid. This project is a
simulation and a learning-oriented open-source project; contributions that make
it safer, clearer, and more reliable are welcome.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Do **not** report security vulnerabilities in public issues. See
[SECURITY.md](SECURITY.md) for the private reporting process.

Never include real patient data, personal information, credentials, tokens, or
database files in an issue, pull request, or commit.

## Ways to contribute

- Report reproducible bugs
- Improve documentation and examples
- Add tests and accessibility checks
- Fix `good first issue` items
- Improve dispatch logic, performance, or observability
- Review pull requests

If you want to work on an issue, comment on it first so we can avoid duplicate
work. For a new idea, open a feature request before writing a large change.

## Development setup

### Prerequisites

- Node.js 22 LTS
- npm 10+
- A C++ build toolchain if `better-sqlite3` needs to compile

### Install and run

```sh
git clone https://github.com/radheshyam-bhati/VAGRHUB.git
cd Emergency
npm ci
cp .env.example .env
```

Set `JWT_SECRET` in `.env` to a 32+ character random value:

```sh
openssl rand -base64 48
```

For local demo data, set `SEED_DEMO_DATA=true` and choose local demo
credentials in `.env`. Then:

```sh
npm run db:seed
npm run dev
```

The frontend runs at `http://localhost:8080`; the API runs at
`http://localhost:3001`.

### Tests use a temporary database

`npm test` uses a temporary SQLite database. It must never touch
`server/data` or any file you care about. If you add tests that need a
database, use `DATABASE_PATH` and clean up after the suite.

## Branches and commits

Create a branch from `main`:

- `feat/...` for features
- `fix/...` for bug fixes
- `docs/...` for documentation
- `test/...` for tests
- `chore/...` for maintenance
- `security/...` for security hardening

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(dispatch): add queue retry reason to replay
fix(auth): reject admin role during public signup
docs(readme): correct the local frontend port
```

Sign off commits with the Developer Certificate of Origin:

```sh
git commit -s
```

## Pull request checklist

- [ ] The change is focused and linked to an issue (`Closes #...`) or has a clear rationale
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] Tests cover new behavior and edge cases
- [ ] Documentation is updated
- [ ] No secrets, PII, real patient data, or database files are included
- [ ] Authentication/authorization impact is considered
- [ ] UI changes include screenshots or a short recording
- [ ] New dependencies are justified and license-compatible

## Definition of done

A change is done when it is tested, documented, passes CI, has no known
security regression, and has been reviewed. For security-sensitive changes,
a second review is strongly preferred.

## Review and merge

- Keep pull requests small enough to review in one sitting.
- Address review comments or explain why a suggestion is out of scope.
- Maintainers squash-merge into `main`.
- Releases follow Semantic Versioning and include a changelog entry.

## Good first issues

Look for issues labeled `good first issue`. If you are new to the project,
start with documentation, tests, or a small UI fix. Ask questions in the issue
or in GitHub Discussions.

## Governance

See [GOVERNANCE.md](GOVERNANCE.md). The project currently uses a
maintainer-led model.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
