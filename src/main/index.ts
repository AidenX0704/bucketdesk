import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './app/create-window'
import { registerIpcHandlers } from './ipc'
import { JsonStore } from './persistence/json-store'
import { ConnectionRepository } from './persistence/repositories/connection.repository'
import { TransferRepository } from './persistence/repositories/transfer.repository'
import { ProviderRegistry } from './providers/registry'
import { ConnectionService } from './services/connection.service'
import { CredentialService } from './services/credential.service'
import { DialogService } from './services/dialog.service'
import { SettingService } from './services/setting.service'
import { StorageService } from './services/storage.service'
import { TransferService } from './services/transfer.service'
import { UpdateService } from './services/update.service'
import { WindowService } from './services/window.service'

const providerRegistry = new ProviderRegistry()
const store = new JsonStore()
const credentialService = new CredentialService()
const connectionRepository = new ConnectionRepository(store)
const transferRepository = new TransferRepository(store)
const connectionService = new ConnectionService(
  connectionRepository,
  credentialService,
  providerRegistry
)
const storageService = new StorageService(connectionService, providerRegistry)
const settingService = new SettingService(store)
const transferService = new TransferService(transferRepository, connectionService, providerRegistry, settingService)
const updateService = new UpdateService(settingService)
const dialogService = new DialogService()
const windowService = new WindowService()

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('app.bucketdesk.desktop')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers({
    connections: connectionService,
    storage: storageService,
    transfers: transferService,
    settings: settingService,
    updates: updateService,
    dialogs: dialogService,
    window: windowService
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
