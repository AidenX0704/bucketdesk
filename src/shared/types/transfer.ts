export type TransferDirection = 'upload' | 'download'
export type TransferStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

export interface TransferTask {
  id: string
  connectionId: string
  direction: TransferDirection
  bucket: string
  objectKey: string
  localPath: string
  status: TransferStatus
  totalBytes: number
  transferredBytes: number
  speedBytesPerSecond: number
  resumable?: boolean
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface CreateUploadTaskInput {
  connectionId: string
  bucket: string
  objectKey: string
  localPath: string
}

export interface CreateDownloadTaskInput {
  connectionId: string
  bucket: string
  objectKey: string
  localPath: string
}

export interface TransferProgressEvent {
  task: TransferTask
}
