# Security

## Current Security Baseline
- `.env` is ignored.
- `.env.example` contains placeholders only.
- OAuth token columns are named as encrypted storage targets.
- User model has `password_hash`; plaintext passwords must never be stored.
- Registration stores PBKDF2-HMAC-SHA256 password hashes with per-password salts.
- Login returns signed expiring bearer tokens.
- Protected routes use bearer authentication and active-user checks.
- CORS is configured from environment settings.

## Required Hardening
- Authorization checks on every user-owned resource.
- OAuth minimal scopes, refresh handling, token revocation, and encryption.
- Safe error messages and no secret logging.
- Rate limiting where appropriate.
- Consider replacing the stdlib signed token with standard JWT once a vetted JWT dependency is installed.
