import { contextBridge } from 'electron'
import { desktopApi } from './api/desktop-api'

// Custom APIs for renderer
const api = desktopApi

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
