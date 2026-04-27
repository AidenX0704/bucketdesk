import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

interface StoreState {
  connections: unknown[]
  settings: Record<string, unknown>
  transfers: unknown[]
}

const defaultState: StoreState = {
  connections: [],
  settings: {},
  transfers: []
}

export class JsonStore {
  private state: StoreState

  constructor(private readonly filePath = join(app.getPath('userData'), 'storage-data.json')) {
    this.state = this.load()
  }

  getConnections<T>(): T[] {
    return this.state.connections as T[]
  }

  setConnections<T>(connections: T[]): void {
    this.state.connections = connections
    this.save()
  }

  getSetting<T>(key: string): T | undefined {
    return this.state.settings[key] as T | undefined
  }

  setSetting<T>(key: string, value: T): void {
    this.state.settings[key] = value
    this.save()
  }

  getTransfers<T>(): T[] {
    return this.state.transfers as T[]
  }

  setTransfers<T>(transfers: T[]): void {
    this.state.transfers = transfers
    this.save()
  }

  private load(): StoreState {
    try {
      return { ...defaultState, ...JSON.parse(readFileSync(this.filePath, 'utf8')) }
    } catch {
      return { ...defaultState }
    }
  }

  private save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true })
    writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf8')
  }
}
