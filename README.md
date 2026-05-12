# BucketDesk

BucketDesk is a desktop object storage manager for S3-compatible services, MinIO, Aliyun OSS, and Tencent COS.

It is built for developers, operations engineers, and platform teams who need a focused desktop workflow for browsing buckets, moving objects, validating uploads, and creating temporary share links without switching between cloud consoles.

## Features

- Manage multiple object storage connections.
- Browse buckets, folders, and objects in a desktop file-manager layout.
- Upload, download, rename, move, copy, and delete objects.
- Create buckets and folders.
- Generate presigned share links.
- Track transfer tasks.
- Preview supported object formats.
- Store connection profiles locally with encrypted secrets when Electron safe storage is available.

## Supported Providers

- S3-compatible object storage
- MinIO
- Aliyun OSS
- Tencent COS

## Screenshots

Screenshots will be added before the first public release.

## Tech Stack

- Electron
- React
- TypeScript
- Ant Design
- electron-vite
- electron-builder

## Development

Requirements:

- Node.js 22 or newer
- pnpm 10

Install dependencies:

```bash
pnpm install
```

Start the development app:

```bash
pnpm dev
```

Run type checking:

```bash
pnpm typecheck
```

Run linting:

```bash
pnpm lint
```

Build the application:

```bash
pnpm build
```

Create distributable packages:

```bash
pnpm dist
```

Platform-specific packaging commands:

```bash
pnpm dist:win
pnpm dist:mac
pnpm dist:linux
```

## Security Notes

BucketDesk stores connection data in the local Electron user data directory. Secret access keys are encrypted with Electron `safeStorage` when OS-level encryption is available. If `safeStorage` is unavailable, the current fallback is Base64 encoding, which is not encryption.

Do not commit real endpoints, access keys, secret keys, or local configuration files. Please report security issues privately using the process in [SECURITY.md](./SECURITY.md).

## Roadmap

- Add release screenshots and installation documentation.
- Improve file preview coverage.
- Add batch transfer and retry controls.
- Add more object storage providers.
- Improve local credential storage fallback behavior.
- Add automated release workflow for GitHub Releases.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for local workflow and pull request guidance.

## License

BucketDesk is released under the [MIT License](./LICENSE).
