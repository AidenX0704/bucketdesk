# Security Policy

## Reporting a Vulnerability

Please do not open a public issue for security vulnerabilities.

Report security issues by contacting the maintainer through GitHub: https://github.com/AidenX0704

Include:

- Affected version or commit.
- Reproduction steps.
- Expected impact.
- Any suggested mitigation.

## Credential Storage

BucketDesk stores connection profiles locally in Electron's user data directory. Secret access keys are encrypted with Electron `safeStorage` when OS-level encryption is available.

If `safeStorage` is unavailable, BucketDesk currently falls back to Base64 encoding. Base64 is not encryption, so avoid using long-lived production credentials on systems where OS-level secret storage is unavailable.

## Supported Versions

Security fixes are currently provided for the latest published release and the default branch.
