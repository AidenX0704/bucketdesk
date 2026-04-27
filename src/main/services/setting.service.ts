import type { JsonStore } from '../persistence/json-store'

export class SettingService {
  constructor(private readonly store: JsonStore) {}

  get<T>(key: string): T | undefined {
    return this.store.getSetting<T>(key)
  }

  set<T>(key: string, value: T): void {
    this.store.setSetting(key, value)
  }
}
