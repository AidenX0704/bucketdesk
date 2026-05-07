import { Modal, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import type { TransferTask } from '../../../shared/types/transfer'

export function useTransfers() {
  const [transfers, setTransfers] = useState<TransferTask[]>([])

  const load = useCallback(async () => {
    const result = await window.api.transfers.list()
    if (result.ok) setTransfers(result.data)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(
    () =>
      window.api.transfers.onProgress(({ task }) => {
        setTransfers((current) => {
          if (task.status === 'cancelled' && task.direction === 'download' && task.localPath) {
            const existing = current.find((item) => item.id === task.id)
            if (existing?.status === 'completed') return current.filter((item) => item.id !== task.id)
          }

          const index = current.findIndex((item) => item.id === task.id)
          if (index < 0) return [task, ...current]

          const next = [...current]
          next[index] = task
          return next
        })
      }),
    []
  )

  const createUpload = useCallback(
    async (input: { connectionId: string; bucket: string; objectKey: string; localPath: string }): Promise<void> => {
      await window.api.transfers.createUpload(input)
      await load()
    },
    [load]
  )

  const createDownload = useCallback(
    async (input: { connectionId: string; bucket: string; objectKey: string; localPath: string }): Promise<void> => {
      await window.api.transfers.createDownload(input)
      await load()
    },
    [load]
  )

  const pause = useCallback(async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.pause(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }, [])

  const resume = useCallback(async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.resume(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }, [])

  const cancel = useCallback(async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.cancel(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }, [])

  const retry = useCallback(async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.retry(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }, [])

  const openFile = useCallback(async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.openLocalFile(task.id)
    if (!result.ok) message.error(result.error.message)
  }, [])

  const deleteFile = useCallback((task: TransferTask): void => {
    Modal.confirm({
      centered: true,
      title: '删除下载文件？',
      content: `将删除本地文件并移除传输记录：${task.localPath}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const result = await window.api.transfers.deleteLocalFile(task.id)
        if (result.ok) {
          setTransfers((current) => current.filter((item) => item.id !== task.id))
          message.success('文件和传输记录已删除')
          return
        }

        message.error(result.error.message)
      }
    })
  }, [])

  return {
    transfers,
    load,
    createUpload,
    createDownload,
    pause,
    resume,
    cancel,
    retry,
    openFile,
    deleteFile
  }
}
