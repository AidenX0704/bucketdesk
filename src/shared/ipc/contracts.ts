import type { BucketInfo, CreateBucketInput, DeleteBucketInput } from '../types/bucket'
import type {
  ConnectionSummary,
  CreateConnectionInput,
  UpdateConnectionInput
} from '../types/connection'
import type {
  CopyObjectInput,
  DeleteObjectInput,
  ListObjectsInput,
  ListObjectsResult,
  MoveObjectInput,
  ObjectMetadata,
  ObjectPreviewInput,
  ObjectPreviewResult,
  PresignedUrlInput,
  StatObjectInput
} from '../types/object'
import type { TestConnectionResult } from '../types/provider'
import type { AppResult } from '../types/result'
import type {
  CreateDownloadTaskInput,
  CreateUploadTaskInput,
  TransferProgressEvent,
  TransferTask
} from '../types/transfer'

export interface ConnectionsApi {
  list(): Promise<AppResult<ConnectionSummary[]>>
  create(input: CreateConnectionInput): Promise<AppResult<ConnectionSummary>>
  update(input: UpdateConnectionInput): Promise<AppResult<ConnectionSummary>>
  delete(id: string): Promise<AppResult<void>>
  test(id: string): Promise<AppResult<TestConnectionResult>>
}

export interface StorageApi {
  listBuckets(connectionId: string): Promise<AppResult<BucketInfo[]>>
  createBucket(input: CreateBucketInput): Promise<AppResult<void>>
  deleteBucket(input: DeleteBucketInput): Promise<AppResult<void>>
  listObjects(input: ListObjectsInput): Promise<AppResult<ListObjectsResult>>
  statObject(input: StatObjectInput): Promise<AppResult<ObjectMetadata>>
  deleteObjects(input: DeleteObjectInput): Promise<AppResult<void>>
  copyObject(input: CopyObjectInput): Promise<AppResult<void>>
  moveObject(input: MoveObjectInput): Promise<AppResult<void>>
  createPresignedUrl(input: PresignedUrlInput): Promise<AppResult<string>>
  previewObject(input: ObjectPreviewInput): Promise<AppResult<ObjectPreviewResult>>
}

export interface TransfersApi {
  list(): Promise<AppResult<TransferTask[]>>
  createUpload(input: CreateUploadTaskInput): Promise<AppResult<TransferTask>>
  createDownload(input: CreateDownloadTaskInput): Promise<AppResult<TransferTask>>
  pause(id: string): Promise<AppResult<TransferTask>>
  resume(id: string): Promise<AppResult<TransferTask>>
  cancel(id: string): Promise<AppResult<TransferTask>>
  retry(id: string): Promise<AppResult<TransferTask>>
  openLocalFile(id: string): Promise<AppResult<void>>
  deleteLocalFile(id: string): Promise<AppResult<void>>
  clearCompleted(): Promise<AppResult<void>>
  onProgress(listener: (event: TransferProgressEvent) => void): () => void
}

export interface SettingsApi {
  get<T>(key: string): Promise<AppResult<T | undefined>>
  set<T>(key: string, value: T): Promise<AppResult<void>>
}

export interface DialogsApi {
  selectFiles(): Promise<AppResult<string[]>>
  selectDirectory(): Promise<AppResult<string | undefined>>
}

export interface WindowApi {
  minimize(): Promise<AppResult<void>>
  toggleMaximize(): Promise<AppResult<boolean>>
  close(): Promise<AppResult<void>>
  isMaximized(): Promise<AppResult<boolean>>
  onMaximizeChanged(listener: (isMaximized: boolean) => void): () => void
}

export interface DesktopStorageApi {
  connections: ConnectionsApi
  storage: StorageApi
  transfers: TransfersApi
  settings: SettingsApi
  dialogs: DialogsApi
  window: WindowApi
}
