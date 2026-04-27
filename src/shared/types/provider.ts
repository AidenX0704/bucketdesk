export type ProviderType = 'minio' | 's3-compatible' | 'aliyun-oss' | 'tencent-cos'

export interface ProviderDescriptor {
  type: ProviderType
  name: string
  description: string
  supportsPathStyle: boolean
  requiresRegion: boolean
}

export interface ProviderCapabilities {
  multipartUpload: boolean
  multipartDownload: boolean
  resumableUpload: boolean
  bucketPolicy: boolean
  objectAcl: boolean
  lifecycle: boolean
  versioning: boolean
}

export interface TestConnectionResult {
  ok: boolean
  message: string
  provider: ProviderDescriptor
  capabilities: ProviderCapabilities
}
