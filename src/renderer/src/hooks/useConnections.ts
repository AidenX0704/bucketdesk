import { Modal, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import type { ConnectionSummary, CreateConnectionInput } from '../../../shared/types/connection'

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [activeConnection, setActiveConnection] = useState<ConnectionSummary>()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await window.api.connections.list()
    setLoading(false)

    if (result.ok) {
      setConnections(result.data)
      setActiveConnection((current) => current ?? result.data[0])
      return
    }

    message.error(result.error.message)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (input: CreateConnectionInput): Promise<void> => {
      const result = await window.api.connections.create(input)
      if (!result.ok) {
        message.error(result.error.message)
        return
      }

      message.success('连接已保存')
      setModalOpen(false)
      await load()
    },
    [load]
  )

  const remove = useCallback(
    (connection: ConnectionSummary): void => {
      Modal.confirm({
        centered: true,
        title: `删除连接 ${connection.name}？`,
        content: '删除后本地保存的连接配置也会被移除。',
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          const result = await window.api.connections.delete(connection.id)
          if (!result.ok) {
            message.error(result.error.message)
            return
          }
          setActiveConnection(undefined)
          await load()
        }
      })
    },
    [load]
  )

  const test = useCallback(async (connection: ConnectionSummary): Promise<void> => {
    const result = await window.api.connections.test(connection.id)
    if (result.ok) message.success(result.data.message)
    else message.error(result.error.message)
  }, [])

  const select = useCallback((connection: ConnectionSummary) => {
    setActiveConnection(connection)
  }, [])

  return {
    connections,
    activeConnection,
    loading,
    modalOpen,
    setModalOpen,
    load,
    create,
    remove,
    test,
    select
  }
}
