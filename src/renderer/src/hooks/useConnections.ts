import { Modal, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import type {
  ConnectionSummary,
  CreateConnectionInput,
  UpdateConnectionInput
} from '../../../shared/types/connection'

interface UseConnectionsResult {
  connections: ConnectionSummary[]
  activeConnection: ConnectionSummary | undefined
  loading: boolean
  modalOpen: boolean
  editingConnection: ConnectionSummary | undefined
  openCreateModal: () => void
  openEditModal: (connection: ConnectionSummary) => void
  closeModal: () => void
  load: () => Promise<void>
  create: (input: CreateConnectionInput) => Promise<void>
  update: (input: UpdateConnectionInput) => Promise<void>
  remove: (connection: ConnectionSummary) => void
  test: (connection: ConnectionSummary) => Promise<void>
  select: (connection: ConnectionSummary) => void
}

export function useConnections(): UseConnectionsResult {
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [activeConnection, setActiveConnection] = useState<ConnectionSummary>()
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<ConnectionSummary>()

  const load = useCallback(async () => {
    setLoading(true)
    const result = await window.api.connections.list()
    setLoading(false)

    if (result.ok) {
      setConnections(result.data)
      setActiveConnection((current) => {
        if (!current) return result.data[0]
        return result.data.find((connection) => connection.id === current.id) ?? result.data[0]
      })
      return
    }

    message.error(result.error.message)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timeoutId)
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

  const update = useCallback(
    async (input: UpdateConnectionInput): Promise<void> => {
      const result = await window.api.connections.update(input)
      if (!result.ok) {
        message.error(result.error.message)
        return
      }

      message.success('连接已更新')
      setEditingConnection(undefined)
      setModalOpen(false)
      await load()
    },
    [load]
  )

  const openCreateModal = useCallback(() => {
    setEditingConnection(undefined)
    setModalOpen(true)
  }, [])

  const openEditModal = useCallback((connection: ConnectionSummary) => {
    setEditingConnection(connection)
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingConnection(undefined)
  }, [])

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
    editingConnection,
    openCreateModal,
    openEditModal,
    closeModal,
    load,
    create,
    update,
    remove,
    test,
    select
  }
}
