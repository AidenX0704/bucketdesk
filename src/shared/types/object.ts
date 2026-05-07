export interface StorageObject {
  key: string
  size: number
  etag?: string
  lastModified?: string
  storageClass?: string
  isPrefix?: boolean
}

export interface ListObjectsInput {
  connectionId: string
  bucket: string
  prefix?: string
  continuationToken?: string
  limit?: number
}

export interface ListObjectsResult {
  bucket: string
  prefix: string
  objects: StorageObject[]
  prefixes: string[]
  nextContinuationToken?: string
}

export interface StatObjectInput {
  connectionId: string
  bucket: string
  key: string
}

export interface DeleteObjectInput {
  connectionId: string
  bucket: string
  keys: string[]
}

export interface CopyObjectInput {
  connectionId: string
  sourceBucket: string
  sourceKey: string
  targetBucket: string
  targetKey: string
}

export interface MoveObjectInput extends CopyObjectInput {}

export interface PresignedUrlInput {
  connectionId: string
  bucket: string
  key: string
  expiresInSeconds: number
}

export interface ObjectPreviewInput {
  connectionId: string
  bucket: string
  key: string
}

export type ObjectPreviewType = 'image' | 'pdf' | 'text' | 'office' | 'unsupported'

export interface ObjectPreviewResult {
  key: string
  bucket: string
  fileName: string
  extension: string
  size: number
  contentType?: string
  previewType: ObjectPreviewType
  text?: string
  dataUrl?: string
  url?: string
  officeUrl?: string
  message?: string
}

export interface ReadObjectResult {
  body: Uint8Array
  size: number
  contentType?: string
}

export interface CreateFolderInput {
  connectionId: string
  bucket: string
  key: string
}

export interface ObjectMetadata {
  key: string
  bucket: string
  size: number
  contentType?: string
  etag?: string
  lastModified?: string
  metadata: Record<string, string>
}
