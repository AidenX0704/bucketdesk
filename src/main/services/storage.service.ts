import type { BucketInfo, CreateBucketInput, DeleteBucketInput } from '../../shared/types/bucket'
import type {
  CopyObjectInput,
  DeleteObjectInput,
  ListObjectsInput,
  ListObjectsResult,
  MoveObjectInput,
  ObjectMetadata,
  ObjectPreviewInput,
  ObjectPreviewResult,
  PresignedUrlInput,
  StatObjectInput
} from '../../shared/types/object'
import type { ProviderRegistry } from '../providers/registry'
import type { ConnectionService } from './connection.service'

const maxTextPreviewBytes = 1024 * 1024
const maxBinaryPreviewBytes = 8 * 1024 * 1024
const textExtensions = new Set(['txt', 'md', 'json', 'xml', 'csv', 'log', 'ini', 'conf', 'yaml', 'yml'])
const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'])
const pdfExtensions = new Set(['pdf'])
const officeExtensions = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'])

const getExtension = (key: string): string => {
  const fileName = key.split('/').pop() ?? key
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

const getFileName = (key: string): string => key.split('/').pop() || key

const getTextEncoding = (body: Uint8Array): BufferEncoding => {
  if (body.length >= 3 && body[0] === 0xef && body[1] === 0xbb && body[2] === 0xbf) return 'utf8'
  return 'utf8'
}

export class StorageService {
  constructor(
    private readonly connections: ConnectionService,
    private readonly providers: ProviderRegistry
  ) {}

  async listBuckets(connectionId: string): Promise<BucketInfo[]> {
    const profile = this.connections.getProfile(connectionId)
    return this.providers.get(profile.providerType).listBuckets(profile)
  }

  async createBucket(input: CreateBucketInput): Promise<void> {
    const profile = this.connections.getProfile(input.connectionId)
    await this.providers.get(profile.providerType).createBucket(profile, input)
  }

  async deleteBucket(input: DeleteBucketInput): Promise<void> {
    const profile = this.connections.getProfile(input.connectionId)
    await this.providers.get(profile.providerType).deleteBucket(profile, input)
  }

  async listObjects(input: ListObjectsInput): Promise<ListObjectsResult> {
    const profile = this.connections.getProfile(input.connectionId)
    return this.providers.get(profile.providerType).listObjects(profile, input)
  }

  async statObject(input: StatObjectInput): Promise<ObjectMetadata> {
    const profile = this.connections.getProfile(input.connectionId)
    return this.providers.get(profile.providerType).statObject(profile, input.bucket, input.key)
  }

  async deleteObjects(input: DeleteObjectInput): Promise<void> {
    const profile = this.connections.getProfile(input.connectionId)
    await this.providers.get(profile.providerType).deleteObjects(profile, input)
  }

  async copyObject(input: CopyObjectInput): Promise<void> {
    const profile = this.connections.getProfile(input.connectionId)
    await this.providers.get(profile.providerType).copyObject(profile, input)
  }

  async moveObject(input: MoveObjectInput): Promise<void> {
    const profile = this.connections.getProfile(input.connectionId)
    const provider = this.providers.get(profile.providerType)
    await provider.copyObject(profile, input)
    await provider.deleteObjects(profile, {
      connectionId: input.connectionId,
      bucket: input.sourceBucket,
      keys: [input.sourceKey]
    })
  }

  async createPresignedUrl(input: PresignedUrlInput): Promise<string> {
    const profile = this.connections.getProfile(input.connectionId)
    return this.providers.get(profile.providerType).createPresignedUrl(profile, input)
  }

  async previewObject(input: ObjectPreviewInput): Promise<ObjectPreviewResult> {
    const profile = this.connections.getProfile(input.connectionId)
    const provider = this.providers.get(profile.providerType)
    const metadata = await provider.statObject(profile, input.bucket, input.key)
    const extension = getExtension(input.key)
    const basePreview = {
      key: input.key,
      bucket: input.bucket,
      fileName: getFileName(input.key),
      extension,
      size: metadata.size,
      contentType: metadata.contentType
    }

    if (textExtensions.has(extension)) {
      if (metadata.size > maxTextPreviewBytes) {
        return {
          ...basePreview,
          previewType: 'unsupported',
          message: '文本文件超过 1 MB，请下载后查看。'
        }
      }

      const object = await provider.readObject(profile, input.bucket, input.key)
      return {
        ...basePreview,
        size: object.size,
        contentType: object.contentType ?? metadata.contentType,
        previewType: 'text',
        text: Buffer.from(object.body).toString(getTextEncoding(object.body))
      }
    }

    if (imageExtensions.has(extension) || pdfExtensions.has(extension)) {
      if (metadata.size > maxBinaryPreviewBytes) {
        return {
          ...basePreview,
          previewType: 'unsupported',
          message: '文件超过 8 MB，请使用预签名链接或下载查看。'
        }
      }

      const object = await provider.readObject(profile, input.bucket, input.key)
      const contentType = object.contentType ?? metadata.contentType ?? (pdfExtensions.has(extension) ? 'application/pdf' : `image/${extension === 'jpg' ? 'jpeg' : extension}`)

      return {
        ...basePreview,
        size: object.size,
        contentType,
        previewType: pdfExtensions.has(extension) ? 'pdf' : 'image',
        dataUrl: `data:${contentType};base64,${Buffer.from(object.body).toString('base64')}`
      }
    }

    if (officeExtensions.has(extension)) {
      const url = await provider.createPresignedUrl(profile, {
        connectionId: input.connectionId,
        bucket: input.bucket,
        key: input.key,
        expiresInSeconds: 3600
      })

      return {
        ...basePreview,
        previewType: 'office',
        url,
        officeUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
        message: 'Office 文档使用在线预览服务打开，链接 1 小时内有效。'
      }
    }

    return {
      ...basePreview,
      previewType: 'unsupported',
      message: '当前格式暂不支持预览，请下载后查看。'
    }
  }
}
