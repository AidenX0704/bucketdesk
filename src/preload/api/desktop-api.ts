import { ipcRenderer } from 'electron'
import { ipcChannels } from '../../shared/ipc/channels'
import type { DesktopStorageApi } from '../../shared/ipc/contracts'

export const desktopApi: DesktopStorageApi = {
  connections: {
    list: () => ipcRenderer.invoke(ipcChannels.connections.list),
    create: (input) => ipcRenderer.invoke(ipcChannels.connections.create, input),
    update: (input) => ipcRenderer.invoke(ipcChannels.connections.update, input),
    delete: (id) => ipcRenderer.invoke(ipcChannels.connections.delete, id),
    test: (id) => ipcRenderer.invoke(ipcChannels.connections.test, id)
  },
  storage: {
    listBuckets: (connectionId) => ipcRenderer.invoke(ipcChannels.buckets.list, connectionId),
    createBucket: (input) => ipcRenderer.invoke(ipcChannels.buckets.create, input),
    deleteBucket: (input) => ipcRenderer.invoke(ipcChannels.buckets.delete, input),
    listObjects: (input) => ipcRenderer.invoke(ipcChannels.objects.list, input),
    statObject: (input) => ipcRenderer.invoke(ipcChannels.objects.stat, input),
    deleteObjects: (input) => ipcRenderer.invoke(ipcChannels.objects.delete, input),
    copyObject: (input) => ipcRenderer.invoke(ipcChannels.objects.copy, input),
    moveObject: (input) => ipcRenderer.invoke(ipcChannels.objects.move, input),
    createPresignedUrl: (input) => ipcRenderer.invoke(ipcChannels.objects.presignUrl, input),
    previewObject: (input) => ipcRenderer.invoke(ipcChannels.objects.preview, input),
    createFolder: (input) => ipcRenderer.invoke(ipcChannels.objects.createFolder, input)
  },
  transfers: {
    list: () => ipcRenderer.invoke(ipcChannels.transfers.list),
    createUpload: (input) => ipcRenderer.invoke(ipcChannels.transfers.createUpload, input),
    createDownload: (input) => ipcRenderer.invoke(ipcChannels.transfers.createDownload, input),
    pause: (id) => ipcRenderer.invoke(ipcChannels.transfers.pause, id),
    resume: (id) => ipcRenderer.invoke(ipcChannels.transfers.resume, id),
    cancel: (id) => ipcRenderer.invoke(ipcChannels.transfers.cancel, id),
    retry: (id) => ipcRenderer.invoke(ipcChannels.transfers.retry, id),
    openLocalFile: (id) => ipcRenderer.invoke(ipcChannels.transfers.openLocalFile, id),
    deleteLocalFile: (id) => ipcRenderer.invoke(ipcChannels.transfers.deleteLocalFile, id),
    clearCompleted: () => ipcRenderer.invoke(ipcChannels.transfers.clearCompleted),
    onProgress: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, event: Parameters<typeof listener>[0]): void => {
        listener(event)
      }

      ipcRenderer.on(ipcChannels.transfers.progress, handler)
      return () => ipcRenderer.removeListener(ipcChannels.transfers.progress, handler)
    }
  },
  settings: {
    get: (key) => ipcRenderer.invoke(ipcChannels.settings.get, key),
    set: (key, value) => ipcRenderer.invoke(ipcChannels.settings.set, key, value)
  },
  updates: {
    check: (input) => ipcRenderer.invoke(ipcChannels.updates.check, input)
  },
  dialogs: {
    selectFiles: () => ipcRenderer.invoke(ipcChannels.dialogs.selectFiles),
    selectDirectory: () => ipcRenderer.invoke(ipcChannels.dialogs.selectDirectory)
  },
  window: {
    minimize: () => ipcRenderer.invoke(ipcChannels.window.minimize),
    toggleMaximize: () => ipcRenderer.invoke(ipcChannels.window.toggleMaximize),
    close: () => ipcRenderer.invoke(ipcChannels.window.close),
    isMaximized: () => ipcRenderer.invoke(ipcChannels.window.isMaximized),
    onMaximizeChanged: (listener) => {
      const handler = (_event: Electron.IpcRendererEvent, isMaximized: boolean): void => {
        listener(isMaximized)
      }

      ipcRenderer.on(ipcChannels.window.maximizeChanged, handler)
      return () => ipcRenderer.removeListener(ipcChannels.window.maximizeChanged, handler)
    }
  }
}
