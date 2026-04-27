import { ProviderBase } from '../provider-base'

export class TencentCosProvider extends ProviderBase {
  constructor() {
    super(
      {
        type: 'tencent-cos',
        name: '腾讯云 COS',
        description: 'Tencent Cloud Cloud Object Storage',
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
