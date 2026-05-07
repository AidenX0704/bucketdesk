import { ipcChannels } from '../../shared/ipc/channels'
import { BrowserWindow } from 'electron'
import type { CreateBucketInput, DeleteBucketInput } from '../../shared/types/bucket'
import type { CreateConnectionInput, UpdateConnectionInput } from '../../shared/types/connection'
import type {
  CopyObjectInput,
  CreateFolderInput,
  DeleteObjectInput,
  ListObjectsInput,
  MoveObjectInput,
  ObjectPreviewInput,
  PresignedUrlInput,
  StatObjectInput
} from '../../shared/types/object'
import type { CreateDownloadTaskInput, CreateUploadTaskInput } from '../../shared/types/transfer'
import type { ConnectionService } from '../services/connection.service'
import type { DialogService } from '../services/dialog.service'
import type { SettingService } from '../services/setting.service'
import type { StorageService } from '../services/storage.service'
import type { TransferService } from '../services/transfer.service'
import type { WindowService } from '../services/window.service'
import { registerHandler } from './router'

export interface IpcServices {
  connections: ConnectionService
  storage: StorageService
  transfers: TransferService
  settings: SettingService
  dialogs: DialogService
  window: WindowService
}

const getWindow = (): BrowserWindow => {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]

  if (!window) {
    throw new Error('Application window not found')
  }

  return window
}

export const registerIpcHandlers = (services: IpcServices): void => {
  registerHandler(ipcChannels.connections.list, () => services.connections.list())
  registerHandler(ipcChannels.connections.create, (input: CreateConnectionInput) =>
    services.connections.create(input)
  )
  registerHandler(ipcChannels.connections.update, (input: UpdateConnectionInput) =>
    services.connections.update(input)
  )
  registerHandler(ipcChannels.connections.delete, (id: string) => services.connections.delete(id))
  registerHandler(ipcChannels.connections.test, (id: string) => services.connections.test(id))

  registerHandler(ipcChannels.buckets.list, (connectionId: string) =>
    services.storage.listBuckets(connectionId)
  )
  registerHandler(ipcChannels.buckets.create, (input: CreateBucketInput) =>
    services.storage.createBucket(input)
  )
  registerHandler(ipcChannels.buckets.delete, (input: DeleteBucketInput) =>
    services.storage.deleteBucket(input)
  )
  registerHandler(ipcChannels.objects.list, (input: ListObjectsInput) =>
    services.storage.listObjects(input)
  )
  registerHandler(ipcChannels.objects.stat, (input: StatObjectInput) => services.storage.statObject(input))
  registerHandler(ipcChannels.objects.delete, (input: DeleteObjectInput) =>
    services.storage.deleteObjects(input)
  )
  registerHandler(ipcChannels.objects.copy, (input: CopyObjectInput) =>
    services.storage.copyObject(input)
  )
  registerHandler(ipcChannels.objects.move, (input: MoveObjectInput) =>
    services.storage.moveObject(input)
  )
  registerHandler(ipcChannels.objects.presignUrl, (input: PresignedUrlInput) =>
    services.storage.createPresignedUrl(input)
  )
  registerHandler(ipcChannels.objects.preview, (input: ObjectPreviewInput) =>
    services.storage.previewObject(input)
  )
  registerHandler(ipcChannels.objects.createFolder, (input: CreateFolderInput) =>
    services.storage.createFolder(input)
  )

  registerHandler(ipcChannels.transfers.list, () => services.transfers.list())
  registerHandler(ipcChannels.transfers.createUpload, (input: CreateUploadTaskInput) =>
    services.transfers.createUpload(input)
  )
  registerHandler(ipcChannels.transfers.createDownload, (input: CreateDownloadTaskInput) =>
    services.transfers.createDownload(input)
  )
  registerHandler(ipcChannels.transfers.pause, (id: string) => services.transfers.pause(id))
  registerHandler(ipcChannels.transfers.resume, (id: string) => services.transfers.resume(id))
  registerHandler(ipcChannels.transfers.cancel, (id: string) => services.transfers.cancel(id))
  registerHandler(ipcChannels.transfers.retry, (id: string) => services.transfers.retry(id))
  registerHandler(ipcChannels.transfers.openLocalFile, (id: string) =>
    services.transfers.openLocalFile(id)
  )
  registerHandler(ipcChannels.transfers.deleteLocalFile, (id: string) =>
    services.transfers.deleteLocalFile(id)
  )
  registerHandler(ipcChannels.transfers.clearCompleted, () => services.transfers.clearCompleted())

  registerHandler(ipcChannels.settings.get, (key: string) => services.settings.get(key))
  registerHandler(ipcChannels.settings.set, (key: string, value: unknown) => {
    services.settings.set(key, value)
    if (key === 'concurrency') {
      services.transfers.updateConcurrency()
    }
  })

  registerHandler(ipcChannels.dialogs.selectFiles, () => services.dialogs.selectFiles())
  registerHandler(ipcChannels.dialogs.selectDirectory, () => services.dialogs.selectDirectory())

  registerHandler(ipcChannels.window.minimize, () => services.window.minimize(getWindow()))
  registerHandler(ipcChannels.window.toggleMaximize, () => services.window.toggleMaximize(getWindow()))
  registerHandler(ipcChannels.window.close, () => services.window.close(getWindow()))
  registerHandler(ipcChannels.window.isMaximized, () => services.window.isMaximized(getWindow()))
}
