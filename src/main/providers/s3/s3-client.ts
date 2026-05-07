import {
  CopyObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createReadStream, createWriteStream, statSync } from 'fs'
import { lookup } from 'mime-types'
import { Transform } from 'stream'
import { pipeline } from 'stream/promises'
import type { BucketInfo } from '../../../shared/types/bucket'
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
import type { DownloadObjectOptions, UploadObjectOptions } from '../../core/ports/storage-provider'

export class S3ClientAdapter {
  createClient(profile: ConnectionProfile): S3Client {
    return new S3Client({
      endpoint: profile.endpoint,
      region: profile.region || 'us-east-1',
      forcePathStyle: profile.pathStyle,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: profile.accessKeyId,
        secretAccessKey: profile.secretAccessKey ?? ''
      }
    })
  }

  async listBuckets(profile: ConnectionProfile): Promise<BucketInfo[]> {
    const response = await this.createClient(profile).send(new ListBucketsCommand({}))
    return (response.Buckets ?? []).map((bucket) => ({
      name: bucket.Name ?? '',
      createdAt: bucket.CreationDate?.toISOString()
    }))
  }

  async createBucket(profile: ConnectionProfile, bucket: string): Promise<void> {
    await this.createClient(profile).send(new CreateBucketCommand({ Bucket: bucket }))
  }

  async deleteBucket(profile: ConnectionProfile, bucket: string): Promise<void> {
    await this.createClient(profile).send(new DeleteBucketCommand({ Bucket: bucket }))
  }

  async listObjects(profile: ConnectionProfile, input: ListObjectsInput): Promise<ListObjectsResult> {
    const prefix = input.prefix ?? ''
    const response = await this.createClient(profile).send(
      new ListObjectsV2Command({
        Bucket: input.bucket,
        Prefix: prefix,
        Delimiter: '/',
        ContinuationToken: input.continuationToken,
        MaxKeys: input.limit ?? 1000
      })
    )

    return {
      bucket: input.bucket,
      prefix,
      objects: (response.Contents ?? [])
        .filter((object) => object.Key !== prefix && object.Key && !object.Key.endsWith('/'))
        .map((object) => ({
          key: object.Key ?? '',
          size: object.Size ?? 0,
          etag: object.ETag,
          lastModified: object.LastModified?.toISOString(),
          storageClass: object.StorageClass
        })),
      prefixes: (response.CommonPrefixes ?? []).map((commonPrefix) => commonPrefix.Prefix ?? ''),
      nextContinuationToken: response.NextContinuationToken
    }
  }

  async statObject(profile: ConnectionProfile, bucket: string, key: string): Promise<ObjectMetadata> {
    const response = await this.createClient(profile).send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return {
      bucket,
      key,
      size: response.ContentLength ?? 0,
      contentType: response.ContentType,
      etag: response.ETag,
      lastModified: response.LastModified?.toISOString(),
      metadata: response.Metadata ?? {}
    }
  }

  async readObject(profile: ConnectionProfile, bucket: string, key: string): Promise<ReadObjectResult> {
    const response = await this.createClient(profile).send(new GetObjectCommand({ Bucket: bucket, Key: key }))

    if (!response.Body) {
      throw new Error('Empty object response body')
    }

    const chunks: Buffer[] = []

    for await (const chunk of response.Body as NodeJS.ReadableStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    const body = Buffer.concat(chunks)

    return {
      body,
      size: response.ContentLength ?? body.length,
      contentType: response.ContentType
    }
  }

  async deleteObjects(profile: ConnectionProfile, input: DeleteObjectInput): Promise<void> {
    await this.createClient(profile).send(
      new DeleteObjectsCommand({
        Bucket: input.bucket,
        Delete: {
          Objects: input.keys.map((Key) => ({ Key }))
        }
      })
    )
  }

  async copyObject(profile: ConnectionProfile, input: CopyObjectInput): Promise<void> {
    await this.createClient(profile).send(
      new CopyObjectCommand({
        Bucket: input.targetBucket,
        Key: input.targetKey,
        CopySource: encodeURI(`${input.sourceBucket}/${input.sourceKey}`)
      })
    )
  }

  async createPresignedUrl(profile: ConnectionProfile, input: PresignedUrlInput): Promise<string> {
    return getSignedUrl(
      this.createClient(profile),
      new GetObjectCommand({ Bucket: input.bucket, Key: input.key }),
      { expiresIn: input.expiresInSeconds }
    )
  }

  async createFolder(profile: ConnectionProfile, bucket: string, key: string): Promise<void> {
    const folderKey = key.endsWith('/') ? key : `${key}/`
    await this.createClient(profile).send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: folderKey,
        Body: Buffer.alloc(0)
      })
    )
  }

  async uploadObject(profile: ConnectionProfile, input: CreateUploadTaskInput, options?: UploadObjectOptions): Promise<void> {
    const stat = statSync(input.localPath)
    const contentType = lookup(input.localPath) || undefined
    const totalBytes = stat.size
    let transferredBytes = 0

    const progressStream = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        transferredBytes += chunk.length
        options?.onProgress?.({ transferredBytes, totalBytes })
        callback(null, chunk)
      }
    })

    const body = createReadStream(input.localPath).pipe(progressStream)

    try {
      await this.createClient(profile).send(
        new PutObjectCommand({
          Bucket: input.bucket,
          Key: input.objectKey,
          Body: body,
          ContentLength: totalBytes,
          ContentType: contentType
        }),
        { abortSignal: options?.signal }
      )
    } finally {
      progressStream.destroy()
    }
  }

  async downloadObject(
    profile: ConnectionProfile,
    input: CreateDownloadTaskInput,
    options?: DownloadObjectOptions
  ): Promise<void> {
    const startByte = options?.startByte ?? 0
    const response = await this.createClient(profile).send(
      new GetObjectCommand({
        Bucket: input.bucket,
        Key: input.objectKey,
        Range: startByte > 0 ? `bytes=${startByte}-` : undefined
      }),
      { abortSignal: options?.signal }
    )

    if (!response.Body) {
      throw new Error('Empty object response body')
    }

    const totalBytes = startByte + (response.ContentLength ?? 0)
    let transferredBytes = startByte
    const body = response.Body as NodeJS.ReadableStream

    body.on('data', (chunk: Buffer | string) => {
      transferredBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)
      options?.onProgress?.({ transferredBytes, totalBytes })
    })

    await pipeline(body, createWriteStream(input.localPath, { flags: startByte > 0 ? 'a' : 'w' }))
  }
}
