import { S3CompatibleProvider } from '../s3/s3.provider'

export class MinioProvider extends S3CompatibleProvider {
  constructor() {
    super()
    Object.assign(this.descriptor, {
      type: 'minio',
      name: 'MinIO',
      description: 'Self-hosted and S3-compatible object storage'
    })
  }
}
