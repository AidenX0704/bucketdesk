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

---

# 中文说明

BucketDesk 是一款桌面端对象存储管理工具，面向 S3 兼容服务、MinIO、阿里云 OSS 和腾讯云 COS。

它适合开发者、运维工程师、平台工程师和需要日常管理对象存储的技术用户使用。你可以在桌面应用中管理多个云存储连接，浏览 Bucket 和对象，上传下载文件，校验上传结果，创建临时分享链接，而不必频繁切换不同云厂商控制台。

## 功能特性

- 管理多个对象存储连接。
- 以桌面文件管理器的方式浏览 Bucket、文件夹和对象。
- 上传、下载、重命名、移动、复制和删除对象。
- 创建 Bucket 和文件夹。
- 生成预签名分享链接。
- 查看和跟踪传输任务。
- 预览支持的对象格式。
- 连接配置保存在本地；当 Electron `safeStorage` 可用时，会加密保存 Secret Access Key。

## 支持的存储服务

- S3 兼容对象存储
- MinIO
- 阿里云 OSS
- 腾讯云 COS

## 截图

首个公开版本发布前会补充应用截图。

## 技术栈

- Electron
- React
- TypeScript
- Ant Design
- electron-vite
- electron-builder

## 本地开发

环境要求：

- Node.js 22 或更高版本
- pnpm 10

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

运行类型检查：

```bash
pnpm typecheck
```

运行代码检查：

```bash
pnpm lint
```

构建应用：

```bash
pnpm build
```

生成安装包或分发产物：

```bash
pnpm dist
```

按平台打包：

```bash
pnpm dist:win
pnpm dist:mac
pnpm dist:linux
```

## 安全说明

BucketDesk 会把连接配置保存在本地 Electron 用户数据目录中。Secret Access Key 会在系统支持 Electron `safeStorage` 时加密保存。如果当前系统环境不支持 `safeStorage`，应用目前会退回到 Base64 编码；Base64 不是加密，不建议在这类环境中保存长期生产凭据。

请不要提交真实 Endpoint、Access Key、Secret Key 或本地配置文件。如果发现安全问题，请按照 [SECURITY.md](./SECURITY.md) 中的方式私下报告。

## 路线图

- 补充发布截图和安装说明。
- 改进文件预览能力。
- 增强批量传输和重试控制。
- 支持更多对象存储服务。
- 优化本地凭据存储的 fallback 行为。
- 增加 GitHub Releases 自动发布流程。

## 参与贡献

欢迎提交贡献。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，了解本地开发流程和 Pull Request 要求。

## 开源协议

BucketDesk 基于 [MIT License](./LICENSE) 开源。
