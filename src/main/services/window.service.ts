import type { BrowserWindow } from 'electron'

export class WindowService {
  minimize(window: BrowserWindow): void {
    window.minimize()
  }

  toggleMaximize(window: BrowserWindow): boolean {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }

    return window.isMaximized()
  }

  close(window: BrowserWindow): void {
    window.close()
  }

  isMaximized(window: BrowserWindow): boolean {
    return window.isMaximized()
  }
}
