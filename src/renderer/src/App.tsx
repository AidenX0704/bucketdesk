import { App as AntApp, Button, ConfigProvider, Input, Modal, Space, message, theme } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BucketInfo } from '../../shared/types/bucket'
import type { ConnectionSummary, CreateConnectionInput } from '../../shared/types/connection'
import type { ListObjectsResult, StorageObject } from '../../shared/types/object'
import type { TransferTask } from '../../shared/types/transfer'
import { PageHeader } from './components/PageHeader'
import { ConnectionList } from './features/connections/ConnectionList'
import { ConnectionModal } from './features/connections/ConnectionModal'
import { OverviewCards } from './features/dashboard/OverviewCards'
import { SettingsPage } from './features/settings/SettingsPage'
import { BucketTable } from './features/storage/BucketTable'
import { ObjectTable } from './features/storage/ObjectTable'
import { TransferPanel } from './features/transfers/TransferPanel'
import { MainLayout, type AppPage } from './layouts/MainLayout'

function App(): React.JSX.Element {
  const [activePage, setActivePage] = useState<AppPage>('overview')
  const [connections, setConnections] = useState<ConnectionSummary[]>([])
  const [activeConnection, setActiveConnection] = useState<ConnectionSummary>()
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [objectsResult, setObjectsResult] = useState<ListObjectsResult>()
  const [activeBucket, setActiveBucket] = useState<string>()
  const [prefix, setPrefix] = useState('')
  const [transfers, setTransfers] = useState<TransferTask[]>([])
  const [connectionModalOpen, setConnectionModalOpen] = useState(false)
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [loadingBuckets, setLoadingBuckets] = useState(false)
  const [loadingObjects, setLoadingObjects] = useState(false)

  if (!window.api) {
    return <div className="api-error">Preload API 未加载，请确认当前页面运行在 Electron 窗口中。</div>
  }

  const loadConnections = useCallback(async () => {
    setLoadingConnections(true)
    const result = await window.api.connections.list()
    setLoadingConnections(false)

    if (result.ok) {
      setConnections(result.data)
      setActiveConnection((current) => current ?? result.data[0])
      return
    }

    message.error(result.error.message)
  }, [])

  const loadTransfers = useCallback(async () => {
    const result = await window.api.transfers.list()
    if (result.ok) setTransfers(result.data)
  }, [])

  const loadBuckets = useCallback(async () => {
    if (!activeConnection) return

    setLoadingBuckets(true)
    const result = await window.api.storage.listBuckets(activeConnection.id)
    setLoadingBuckets(false)

    if (result.ok) {
      setBuckets(result.data)
      return
    }

    message.error(result.error.message)
  }, [activeConnection])

  const loadObjects = useCallback(async () => {
    if (!activeConnection || !activeBucket) return

    setLoadingObjects(true)
    const result = await window.api.storage.listObjects({
      connectionId: activeConnection.id,
      bucket: activeBucket,
      prefix
    })
    setLoadingObjects(false)

    if (result.ok) {
      setObjectsResult(result.data)
      return
    }

    message.error(result.error.message)
  }, [activeBucket, activeConnection, prefix])

  useEffect(() => {
    void loadConnections()
    void loadTransfers()
  }, [loadConnections, loadTransfers])

  useEffect(() => {
    setActiveBucket(undefined)
    setObjectsResult(undefined)
    void loadBuckets()
  }, [activeConnection, loadBuckets])

  useEffect(() => {
    void loadObjects()
  }, [loadObjects])

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

  const createConnection = async (input: CreateConnectionInput): Promise<void> => {
    const result = await window.api.connections.create(input)
    if (!result.ok) {
      message.error(result.error.message)
      return
    }

    message.success('连接已保存')
    setConnectionModalOpen(false)
    await loadConnections()
  }

  const deleteConnection = async (connection: ConnectionSummary): Promise<void> => {
    Modal.confirm({
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
        await loadConnections()
      }
    })
  }

  const testConnection = async (connection: ConnectionSummary): Promise<void> => {
    const result = await window.api.connections.test(connection.id)
    if (result.ok) message.success(result.data.message)
    else message.error(result.error.message)
  }

  const createBucket = async (): Promise<void> => {
    if (!activeConnection) return
    let bucketName = ''
    Modal.confirm({
      title: '创建 Bucket',
      content: <Input placeholder="bucket-name" onChange={(event) => (bucketName = event.target.value)} />,
      okText: '创建',
      cancelText: '取消',
      onOk: async () => {
        const result = await window.api.storage.createBucket({ connectionId: activeConnection.id, name: bucketName })
        if (result.ok) await loadBuckets()
        else message.error(result.error.message)
      }
    })
  }

  const deleteBucket = async (bucket: BucketInfo): Promise<void> => {
    if (!activeConnection) return
    Modal.confirm({
      title: `删除 Bucket ${bucket.name}？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const result = await window.api.storage.deleteBucket({ connectionId: activeConnection.id, name: bucket.name })
        if (result.ok) await loadBuckets()
        else message.error(result.error.message)
      }
    })
  }

  const uploadObject = async (): Promise<void> => {
    if (!activeConnection || !activeBucket) return
    const result = await window.api.dialogs.selectFiles()
    if (!result.ok || result.data.length === 0) return

    for (const localPath of result.data) {
      const fileName = localPath.split(/[\\/]/).pop() ?? 'file'
      await window.api.transfers.createUpload({
        connectionId: activeConnection.id,
        bucket: activeBucket,
        objectKey: `${prefix}${fileName}`,
        localPath
      })
    }
    setActivePage('transfers')
    await loadTransfers()
  }

  const downloadObject = async (object: StorageObject): Promise<void> => {
    if (!activeConnection || !activeBucket) return
    const directory = await window.api.dialogs.selectDirectory()
    if (!directory.ok || !directory.data) return

    const fileName = object.key.split('/').pop() ?? object.key
    await window.api.transfers.createDownload({
      connectionId: activeConnection.id,
      bucket: activeBucket,
      objectKey: object.key,
      localPath: `${directory.data}\\${fileName}`
    })
    setActivePage('transfers')
    await loadTransfers()
  }

  const deleteObject = async (object: StorageObject): Promise<void> => {
    if (!activeConnection || !activeBucket) return
    Modal.confirm({
      title: `删除对象 ${object.key}？`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const result = await window.api.storage.deleteObjects({
          connectionId: activeConnection.id,
          bucket: activeBucket,
          keys: [object.key]
        })
        if (result.ok) await loadObjects()
        else message.error(result.error.message)
      }
    })
  }

  const createPresignedUrl = async (object: StorageObject): Promise<void> => {
    if (!activeConnection || !activeBucket) return
    const result = await window.api.storage.createPresignedUrl({
      connectionId: activeConnection.id,
      bucket: activeBucket,
      key: object.key,
      expiresInSeconds: 3600
    })
    if (result.ok) void navigator.clipboard.writeText(result.data).then(() => message.success('链接已复制'))
    else message.error(result.error.message)
  }

  const pauseTransfer = async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.pause(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }

  const resumeTransfer = async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.resume(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }

  const cancelTransfer = async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.cancel(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }

  const retryTransfer = async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.retry(task.id)
    if (result.ok) setTransfers((current) => current.map((item) => (item.id === task.id ? result.data : item)))
    else message.error(result.error.message)
  }

  const openDownloadedFile = async (task: TransferTask): Promise<void> => {
    const result = await window.api.transfers.openLocalFile(task.id)
    if (!result.ok) message.error(result.error.message)
  }

  const deleteDownloadedFile = async (task: TransferTask): Promise<void> => {
    Modal.confirm({
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
  }

  const sidebar = useMemo(
    () => (
      <ConnectionList
        connections={connections}
        activeConnectionId={activeConnection?.id}
        loading={loadingConnections}
        onRefresh={loadConnections}
        onCreate={() => setConnectionModalOpen(true)}
        onTest={(connection) => void testConnection(connection)}
        onDelete={(connection) => void deleteConnection(connection)}
        onSelect={(connection) => {
          setActiveConnection(connection)
          setActivePage('storage')
        }}
      />
    ),
    [activeConnection?.id, connections, loadConnections, loadingConnections]
  )

  const storageContent = activeBucket ? (
    <ObjectTable
      connectionId={activeConnection?.id}
      bucket={activeBucket}
      prefix={prefix}
      objects={objectsResult?.objects ?? []}
      prefixes={objectsResult?.prefixes ?? []}
      loading={loadingObjects}
      onOpenPrefix={setPrefix}
      onUpload={() => void uploadObject()}
      onDownload={(object) => void downloadObject(object)}
      onDelete={(object) => void deleteObject(object)}
      onPresign={(object) => void createPresignedUrl(object)}
      onBackToBuckets={() => setActiveBucket(undefined)}
    />
  ) : (
    <BucketTable
      buckets={buckets}
      loading={loadingBuckets}
      hasConnection={Boolean(activeConnection)}
      onCreate={() => void createBucket()}
      onDelete={(bucket) => void deleteBucket(bucket)}
      onOpen={(bucket) => {
        setPrefix('')
        setActiveBucket(bucket.name)
      }}
    />
  )

  const pageContent = {
    overview: (
      <>
        <PageHeader title="总览" description="快速了解连接、Bucket 和传输任务状态。" />
        <OverviewCards connectionCount={connections.length} bucketCount={buckets.length} transferCount={transfers.length} />
      </>
    ),
    storage: (
      <>
        <PageHeader
          title="对象存储"
          description="浏览 Bucket、管理对象、创建预签名链接并启动上传下载任务。"
          extra={<Button onClick={loadBuckets}>刷新</Button>}
        />
        {storageContent}
      </>
    ),
    transfers: (
      <>
        <PageHeader title="传输中心" description="查看上传下载任务状态、错误和历史记录。" extra={<Button onClick={loadTransfers}>刷新</Button>} />
        <TransferPanel
          tasks={transfers}
          onPause={(task) => void pauseTransfer(task)}
          onResume={(task) => void resumeTransfer(task)}
          onCancel={(task) => void cancelTransfer(task)}
          onRetry={(task) => void retryTransfer(task)}
          onOpenFile={(task) => void openDownloadedFile(task)}
          onDeleteFile={(task) => void deleteDownloadedFile(task)}
        />
      </>
    ),
    settings: (
      <>
        <PageHeader title="设置" description="配置传输偏好、安全策略和应用行为。" />
        <SettingsPage />
      </>
    )
  } satisfies Record<AppPage, React.ReactNode>

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#0ea5e9',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          borderRadius: 12,
          fontSize: 14
        }
      }}
    >
      <AntApp>
        <MainLayout activePage={activePage} sidebar={sidebar} onPageChange={setActivePage}>
          <Space direction="vertical" size={18} className="content-stack">
            {pageContent[activePage]}
          </Space>
        </MainLayout>
        <ConnectionModal open={connectionModalOpen} onCancel={() => setConnectionModalOpen(false)} onSubmit={createConnection} />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
