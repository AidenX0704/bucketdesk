import { BrowserWindow, shell } from 'electron'
import { existsSync, statSync, unlinkSync } from 'fs'
import { ipcChannels } from '../../shared/ipc/channels'
import type {
  CreateDownloadTaskInput,
  CreateUploadTaskInput,
  TransferTask
} from '../../shared/types/transfer'
import type { TransferRepository } from '../persistence/repositories/transfer.repository'
import type { ProviderRegistry } from '../providers/registry'
import type { ConnectionService } from './connection.service'
import type { SettingService } from './setting.service'

interface RunningTransfer {
  controller: AbortController
  requestedStatus?: TransferTask['status']
}

const DEFAULT_CONCURRENCY = 3

export class TransferService {
  private readonly runningTransfers = new Map<string, RunningTransfer>()
  private readonly queuedTaskIds: string[] = []

  constructor(
    private readonly repository: TransferRepository,
    private readonly connections: ConnectionService,
    private readonly providers: ProviderRegistry,
    private readonly settings: SettingService
  ) {}

  private get concurrency(): number {
    return this.settings.get<number>('concurrency') ?? DEFAULT_CONCURRENCY
  }

  list(): TransferTask[] {
    return this.repository.list()
  }

  createUpload(input: CreateUploadTaskInput): TransferTask {
    const task = this.createTask('upload', input)
    this.enqueueTask(task.id)
    return task
  }

  createDownload(input: CreateDownloadTaskInput): TransferTask {
    const task = this.createTask('download', input)
    this.enqueueTask(task.id)
    return task
  }

  pause(id: string): TransferTask {
    const task = this.requireTask(id)

    if (task.status !== 'running' && task.status !== 'queued') return task

    const running = this.runningTransfers.get(id)
    if (running) {
      running.requestedStatus = 'paused'
      running.controller.abort()
    }

    this.removeFromQueue(id)
    return this.updateTask({ ...task, status: 'paused', speedBytesPerSecond: 0 })
  }

  resume(id: string): TransferTask {
    const task = this.requireTask(id)

    if (task.status !== 'paused') return task

    const updated = this.updateTask({ ...task, status: 'queued', speedBytesPerSecond: 0, errorMessage: undefined })
    this.enqueueTask(updated.id)
    return updated
  }

  cancel(id: string): TransferTask {
    const task = this.requireTask(id)
    const running = this.runningTransfers.get(id)

    if (running) {
      running.requestedStatus = 'cancelled'
      running.controller.abort()
    }

    this.removeFromQueue(id)
    return this.updateTask({ ...task, status: 'cancelled', speedBytesPerSecond: 0 })
  }

  retry(id: string): TransferTask {
    const task = this.requireTask(id)
    const updated = this.updateTask({ ...task, status: 'queued', errorMessage: undefined })
    this.enqueueTask(updated.id)
    return updated
  }

  clearCompleted(): void {
    this.repository.clearCompleted()
  }

  async openLocalFile(id: string): Promise<void> {
    const task = this.requireTask(id)

    if (task.direction !== 'download' || task.status !== 'completed') {
      throw new Error('仅支持打开已下载完成的文件')
    }

    if (!existsSync(task.localPath)) {
      throw new Error('本地文件不存在')
    }

    const errorMessage = await shell.openPath(task.localPath)
    if (errorMessage) throw new Error(errorMessage)
  }

  deleteLocalFile(id: string): void {
    const task = this.requireTask(id)

    if (task.status === 'running' || task.status === 'queued') {
      throw new Error('任务正在传输中，请先取消或暂停')
    }

    const running = this.runningTransfers.get(id)
    if (running) {
      running.requestedStatus = 'cancelled'
      running.controller.abort()
    }

    this.removeFromQueue(id)

    if (task.direction === 'download' && existsSync(task.localPath)) {
      unlinkSync(task.localPath)
    }

    this.repository.delete(id)
    this.broadcastTransferChange({ ...task, status: 'cancelled', speedBytesPerSecond: 0 })
  }

  updateConcurrency(): void {
    this.processQueue()
  }

  private enqueueTask(id: string): void {
    if (!this.queuedTaskIds.includes(id)) {
      this.queuedTaskIds.push(id)
    }
    this.processQueue()
  }

  private removeFromQueue(id: string): void {
    const index = this.queuedTaskIds.indexOf(id)
    if (index >= 0) {
      this.queuedTaskIds.splice(index, 1)
    }
  }

  private processQueue(): void {
    while (this.runningTransfers.size < this.concurrency && this.queuedTaskIds.length > 0) {
      const nextId = this.queuedTaskIds.shift()
      if (!nextId) break

      const task = this.repository.findById(nextId)
      if (!task || task.status !== 'queued') continue

      void this.runTask(task)
    }
  }

  private createTask(
    direction: TransferTask['direction'],
    input: CreateUploadTaskInput | CreateDownloadTaskInput
  ): TransferTask {
    const now = new Date().toISOString()
    const totalBytes = direction === 'upload' ? this.getUploadSize(input.localPath) : 0
    const task: TransferTask = {
      id: crypto.randomUUID(),
      connectionId: input.connectionId,
      direction,
      bucket: input.bucket,
      objectKey: input.objectKey,
      localPath: input.localPath,
      status: 'queued',
      totalBytes,
      transferredBytes: 0,
      speedBytesPerSecond: 0,
      resumable: direction === 'download',
      createdAt: now,
      updatedAt: now
    }

    return this.updateTask(task)
  }

  private async runTask(task: TransferTask): Promise<void> {
    if (this.runningTransfers.has(task.id)) return

    const controller = new AbortController()
    const runningTransfer: RunningTransfer = { controller }
    this.runningTransfers.set(task.id, runningTransfer)
    const startByte = task.direction === 'download' ? this.getDownloadOffset(task.localPath) : 0
    const runningTask = this.updateTask({
      ...task,
      status: 'running',
      transferredBytes: startByte,
      speedBytesPerSecond: 0,
      updatedAt: new Date().toISOString()
    })
    let lastProgressBytes = startByte
    let lastProgressTime = Date.now()

    try {
      const profile = this.connections.getProfile(runningTask.connectionId)
      const provider = this.providers.get(profile.providerType)

      if (runningTask.direction === 'upload') {
        await provider.uploadObject(profile, runningTask, {
          signal: controller.signal,
          onProgress: ({ transferredBytes, totalBytes }) => {
            const now = Date.now()
            if (now - lastProgressTime < 500 && transferredBytes !== totalBytes) return

            const elapsedSeconds = Math.max((now - lastProgressTime) / 1000, 0.001)
            const speedBytesPerSecond = Math.max(
              Math.round((transferredBytes - lastProgressBytes) / elapsedSeconds),
              0
            )
            lastProgressBytes = transferredBytes
            lastProgressTime = now
            const latest = this.requireTask(runningTask.id)

            if (latest.status === 'running') {
              this.updateTask({
                ...latest,
                totalBytes,
                transferredBytes,
                speedBytesPerSecond
              })
            }
          }
        })
      } else {
        await provider.downloadObject(profile, runningTask, {
          signal: controller.signal,
          startByte,
          onProgress: ({ transferredBytes, totalBytes }) => {
            const now = Date.now()
            if (now - lastProgressTime < 500 && transferredBytes !== totalBytes) return

            const elapsedSeconds = Math.max((now - lastProgressTime) / 1000, 0.001)
            const speedBytesPerSecond = Math.max(
              Math.round((transferredBytes - lastProgressBytes) / elapsedSeconds),
              0
            )
            lastProgressBytes = transferredBytes
            lastProgressTime = now
            const latest = this.requireTask(runningTask.id)

            if (latest.status === 'running') {
              this.updateTask({
                ...latest,
                totalBytes,
                transferredBytes,
                speedBytesPerSecond
              })
            }
          }
        })
      }

      this.runningTransfers.delete(runningTask.id)
      const latest = this.requireTask(runningTask.id)
      if (latest.status === 'cancelled' || latest.status === 'paused') {
        this.processQueue()
        return
      }

      this.updateTask({
        ...latest,
        status: 'completed',
        transferredBytes: latest.totalBytes,
        speedBytesPerSecond: 0,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      this.runningTransfers.delete(runningTask.id)
      const latest = this.requireTask(runningTask.id)
      if (latest.status === 'cancelled') {
        this.processQueue()
        return
      }
      if (latest.status === 'paused' || runningTransfer.requestedStatus === 'paused') {
        this.updateTask({ ...latest, status: 'paused', speedBytesPerSecond: 0 })
        this.processQueue()
        return
      }

      this.updateTask({
        ...latest,
        status: 'failed',
        speedBytesPerSecond: 0,
        errorMessage: error instanceof Error ? error.message : String(error),
        updatedAt: new Date().toISOString()
      })
    }

    this.processQueue()
  }

  private updateTask(task: TransferTask): TransferTask {
    const updated = this.repository.upsert({ ...task, updatedAt: new Date().toISOString() })

    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(ipcChannels.transfers.progress, { task: updated })
    }

    return updated
  }

  private broadcastTransferChange(task: TransferTask): void {
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send(ipcChannels.transfers.progress, { task })
    }
  }

  private requireTask(id: string): TransferTask {
    const task = this.repository.findById(id)

    if (!task) {
      throw new Error('Transfer task not found')
    }

    return task
  }

  private getUploadSize(localPath: string): number {
    try {
      return statSync(localPath).size
    } catch {
      return 0
    }
  }

  private getDownloadOffset(localPath: string): number {
    try {
      return statSync(localPath).size
    } catch {
      return 0
    }
  }
}
