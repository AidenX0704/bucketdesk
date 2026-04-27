import type { BucketInfo, CreateBucketInput, DeleteBucketInput } from '../../shared/types/bucket'
import type { ConnectionProfile } from '../../shared/types/connection'
import type {
  CopyObjectInput,
  DeleteObjectInput,
  ListObjectsInput,
  ListObjectsResult,
  ObjectMetadata,
  ReadObjectResult,
  PresignedUrlInput
} from '../../shared/types/object'
import type { CreateDownloadTaskInput, CreateUploadTaskInput } from '../../shared/types/transfer'
import type {
  ProviderCapabilities,
  ProviderDescriptor,
  TestConnectionResult
} from '../../shared/types/provider'
import type { StorageProvider } from '../core/ports/storage-provider'
import type { DownloadObjectOptions } from '../core/ports/storage-provider'

const defaultCapabilities: ProviderCapabilities = {
  multipartUpload: true,
  multipartDownload: true,
  resumableUpload: false,
  bucketPolicy: false,
  objectAcl: false,
  lifecycle: false,
  versioning: false
}

export abstract class ProviderBase implements StorageProvider {
  readonly capabilities: ProviderCapabilities

  protected constructor(
    readonly descriptor: ProviderDescriptor,
    capabilities: Partial<ProviderCapabilities> = {}
  ) {
    this.capabilities = { ...defaultCapabilities, ...capabilities }
  }

  async testConnection(_profile: ConnectionProfile): Promise<TestConnectionResult> {
    return {
      ok: true,
      message: `${this.descriptor.name} provider scaffold is ready`,
      provider: this.descriptor,
      capabilities: this.capabilities
    }
  }

  async listBuckets(_profile: ConnectionProfile): Promise<BucketInfo[]> {
    return []
  }

  async createBucket(_profile: ConnectionProfile, _input: CreateBucketInput): Promise<void> {
    throw new Error(`${this.descriptor.name} create bucket is not implemented`)
  }

  async deleteBucket(_profile: ConnectionProfile, _input: DeleteBucketInput): Promise<void> {
    throw new Error(`${this.descriptor.name} delete bucket is not implemented`)
  }

  async listObjects(_profile: ConnectionProfile, input: ListObjectsInput): Promise<ListObjectsResult> {
    return {
      bucket: input.bucket,
      prefix: input.prefix ?? '',
      objects: [],
      prefixes: []
    }
  }

  async statObject(
    _profile: ConnectionProfile,
    bucket: string,
    key: string
  ): Promise<ObjectMetadata> {
    return {
      bucket,
      key,
      size: 0,
      metadata: {}
    }
  }

  async readObject(_profile: ConnectionProfile, _bucket: string, _key: string): Promise<ReadObjectResult> {
    throw new Error(`${this.descriptor.name} object preview is not implemented`)
  }

  async deleteObjects(_profile: ConnectionProfile, _input: DeleteObjectInput): Promise<void> {
    throw new Error(`${this.descriptor.name} delete object is not implemented`)
  }

  async copyObject(_profile: ConnectionProfile, _input: CopyObjectInput): Promise<void> {
    throw new Error(`${this.descriptor.name} copy object is not implemented`)
  }

  async createPresignedUrl(_profile: ConnectionProfile, _input: PresignedUrlInput): Promise<string> {
    throw new Error(`${this.descriptor.name} presigned url is not implemented`)
  }

  async uploadObject(_profile: ConnectionProfile, _input: CreateUploadTaskInput): Promise<void> {
    throw new Error(`${this.descriptor.name} upload is not implemented`)
  }

  async downloadObject(
    _profile: ConnectionProfile,
    _input: CreateDownloadTaskInput,
    _options?: DownloadObjectOptions
  ): Promise<void> {
    throw new Error(`${this.descriptor.name} download is not implemented`)
  }
}
