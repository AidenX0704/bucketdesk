import { ProviderBase } from '../provider-base'

export class AliyunOssProvider extends ProviderBase {
  constructor() {
    super(
      {
        type: 'aliyun-oss',
        name: '阿里云 OSS',
        description: 'Alibaba Cloud Object Storage Service',
        supportsPathStyle: false,
        requiresRegion: true
      },
      {
        objectAcl: true,
        lifecycle: true,
        versioning: true
      }
    )
  }
}
