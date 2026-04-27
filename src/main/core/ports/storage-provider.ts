import type { BucketInfo, CreateBucketInput, DeleteBucketInput } from '../../../shared/types/bucket'
import type { ConnectionProfile } from '../../../shared/types/connection'
import type {
  CopyObjectInput,
  DeleteObjectInput,
  ListObjectsInput,
  ListObjectsResult,
  ObjectMetadata,
  ReadObjectResult,
  PresignedUrlInput
} from '../../../shared/types/object'
import type { CreateDownloadTaskInput, CreateUploadTaskInput } from '../../../shared/types/transfer'
import type {
  ProviderCapabilities,
  ProviderDescriptor,
  TestConnectionResult
} from '../../../shared/types/provider'

export interface StorageProvider {
  readonly descriptor: ProviderDescriptor
  readonly capabilities: ProviderCapabilities

  testConnection(profile: ConnectionProfile): Promise<TestConnectionResult>
  listBuckets(profile: ConnectionProfile): Promise<BucketInfo[]>
  createBucket(profile: ConnectionProfile, input: CreateBucketInput): Promise<void>
  deleteBucket(profile: ConnectionProfile, input: DeleteBucketInput): Promise<void>
  listObjects(profile: ConnectionProfile, input: ListObjectsInput): Promise<ListObjectsResult>
  statObject(profile: ConnectionProfile, bucket: string, key: string): Promise<ObjectMetadata>
  readObject(profile: ConnectionProfile, bucket: string, key: string): Promise<ReadObjectResult>
  deleteObjects(profile: ConnectionProfile, input: DeleteObjectInput): Promise<void>
  copyObject(profile: ConnectionProfile, input: CopyObjectInput): Promise<void>
  createPresignedUrl(profile: ConnectionProfile, input: PresignedUrlInput): Promise<string>
  uploadObject(profile: ConnectionProfile, input: CreateUploadTaskInput): Promise<void>
  downloadObject(
    profile: ConnectionProfile,
    input: CreateDownloadTaskInput,
    options?: DownloadObjectOptions
  ): Promise<void>
}

export interface DownloadObjectOptions {
  signal?: AbortSignal
  startByte?: number
  onProgress?: (event: DownloadProgressEvent) => void
}

export interface DownloadProgressEvent {
  transferredBytes: number
  totalBytes: number
}
