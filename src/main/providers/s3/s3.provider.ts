import { ProviderBase } from '../provider-base'
import type { BucketInfo, CreateBucketInput, DeleteBucketInput } from '../../../shared/types/bucket'
import type { ConnectionProfile } from '../../../shared/types/connection'
import type {
  CopyObjectInput,
  CreateFolderInput,
  DeleteObjectInput,
  ListObjectsInput,
  ListObjectsResult,
  ObjectMetadata,
  ReadObjectResult,
  PresignedUrlInput
} from '../../../shared/types/object'
import type { TestConnectionResult } from '../../../shared/types/provider'
import type { CreateDownloadTaskInput, CreateUploadTaskInput } from '../../../shared/types/transfer'
import type { DownloadObjectOptions, UploadObjectOptions } from '../../core/ports/storage-provider'
import { S3ClientAdapter } from './s3-client'

export class S3CompatibleProvider extends ProviderBase {
  private readonly client = new S3ClientAdapter()

  constructor() {
    super({
      type: 's3-compatible',
      name: 'S3 Compatible',
      description: 'AWS S3 compatible custom endpoint provider',
      supportsPathStyle: true,
      requiresRegion: false
    })
  }

  async testConnection(profile: ConnectionProfile): Promise<TestConnectionResult> {
    await this.listBuckets(profile)
    return {
      ok: true,
      message: '连接成功',
      provider: this.descriptor,
      capabilities: this.capabilities
    }
  }

  listBuckets(profile: ConnectionProfile): Promise<BucketInfo[]> {
    return this.client.listBuckets(profile)
  }

  createBucket(profile: ConnectionProfile, input: CreateBucketInput): Promise<void> {
    return this.client.createBucket(profile, input.name)
  }

  deleteBucket(profile: ConnectionProfile, input: DeleteBucketInput): Promise<void> {
    return this.client.deleteBucket(profile, input.name)
  }

  listObjects(profile: ConnectionProfile, input: ListObjectsInput): Promise<ListObjectsResult> {
    return this.client.listObjects(profile, input)
  }

  statObject(profile: ConnectionProfile, bucket: string, key: string): Promise<ObjectMetadata> {
    return this.client.statObject(profile, bucket, key)
  }

  readObject(profile: ConnectionProfile, bucket: string, key: string): Promise<ReadObjectResult> {
    return this.client.readObject(profile, bucket, key)
  }

  deleteObjects(profile: ConnectionProfile, input: DeleteObjectInput): Promise<void> {
    return this.client.deleteObjects(profile, input)
  }

  copyObject(profile: ConnectionProfile, input: CopyObjectInput): Promise<void> {
    return this.client.copyObject(profile, input)
  }

  createPresignedUrl(profile: ConnectionProfile, input: PresignedUrlInput): Promise<string> {
    return this.client.createPresignedUrl(profile, input)
  }

  uploadObject(profile: ConnectionProfile, input: CreateUploadTaskInput, options?: UploadObjectOptions): Promise<void> {
    return this.client.uploadObject(profile, input, options)
  }

  createFolder(profile: ConnectionProfile, input: CreateFolderInput): Promise<void> {
    return this.client.createFolder(profile, input.bucket, input.key)
  }

  downloadObject(
    profile: ConnectionProfile,
    input: CreateDownloadTaskInput,
    options?: DownloadObjectOptions
  ): Promise<void> {
    return this.client.downloadObject(profile, input, options)
  }
}
