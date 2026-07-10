# Security Policy

## 📦 Supported Versions

This project is a web application maintained on a rolling basis. Security fixes
are applied to the `main` branch and shipped with the next release.

| Version | Supported          |
| ------- | ------------------ |
| `2.7.x` | :white_check_mark: |
| `main`  | :white_check_mark: |
| `< 2.7` | :x:                |

## 🛡️ What This Project Touches

**SCBA Bénévoles** is a Progressive Web App (PWA) backed by Firebase. It:

- Authenticates users via **Firebase Authentication**.
- Stores and reads data in **Cloud Firestore** (matches, registrations, carpooling, broadcasts).
- Runs server logic in **Firebase Cloud Functions**.
- Is typically deployed via **Coolify** on a self-hosted environment.

The security model relies primarily on **Firestore Security Rules** and
**Firebase Authentication** — see `firestore.rules` and `storage.rules` in the
repository.

## 🔐 Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public issue.**

Instead, report it privately:

1. Go to **Security → Report a vulnerability** on the repository
   (<https://github.com/nickdesi/SCBA-Benevolat/security/advisories/new>), or
2. Contact the maintainer directly via a GitHub Security Advisory.

You can expect an acknowledgement within a few days. Once confirmed, a patched
release will be published and you will be credited (unless you prefer to remain
anonymous).

## ✅ Safe-Usage Best Practices

- Keep your **Firebase project** credentials out of version control (use `.env.local`, already git-ignored).
- Review and tighten `firestore.rules` / `storage.rules` before exposing the app publicly.
- Restrict administrative broadcasts and write operations to authenticated admin roles only.
- Keep dependencies up to date and watch the CI dependency audit step.
- Never commit service-account keys or `firebase-admin` credentials.
