import type { ProviderType } from '../../shared/types/provider'
import type { StorageProvider } from '../core/ports/storage-provider'
import { AliyunOssProvider } from './aliyun-oss/aliyun-oss.provider'
import { MinioProvider } from './minio/minio.provider'
import { S3CompatibleProvider } from './s3/s3.provider'
import { TencentCosProvider } from './tencent-cos/tencent-cos.provider'

export class ProviderRegistry {
  private readonly providers = new Map<ProviderType, StorageProvider>()

  constructor() {
    this.register(new MinioProvider())
    this.register(new S3CompatibleProvider())
    this.register(new AliyunOssProvider())
    this.register(new TencentCosProvider())
  }

  list(): StorageProvider[] {
    return [...this.providers.values()]
  }

  get(type: ProviderType): StorageProvider {
    const provider = this.providers.get(type)

    if (!provider) {
      throw new Error(`Unsupported storage provider: ${type}`)
    }

    return provider
  }

  private register(provider: StorageProvider): void {
    this.providers.set(provider.descriptor.type, provider)
  }
}
