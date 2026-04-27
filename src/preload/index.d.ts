import type { DesktopStorageApi } from '../shared/ipc/contracts'

declare global {
  interface Window {
    api: DesktopStorageApi
  }
}
