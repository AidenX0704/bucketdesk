import { App as AntApp, Button, ConfigProvider, Space, theme } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import type { StorageObject } from '../../shared/types/object'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageHeader } from './components/PageHeader'
import { ConnectionList } from './features/connections/ConnectionList'
import { ConnectionModal } from './features/connections/ConnectionModal'
import { OverviewCards } from './features/dashboard/OverviewCards'
import { SettingsPage } from './features/settings/SettingsPage'
import { BucketTable } from './features/storage/BucketTable'
import { ObjectTable } from './features/storage/ObjectTable'
import { TransferPanel } from './features/transfers/TransferPanel'
import { useConnections } from './hooks/useConnections'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useStorageBrowser } from './hooks/useStorageBrowser'
import { useTransfers } from './hooks/useTransfers'
import { MainLayout, type AppPage } from './layouts/MainLayout'

function App(): React.JSX.Element {
  const [activePage, setActivePage] = useState<AppPage>('overview')
  const [selectedObject, setSelectedObject] = useState<StorageObject>()
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')

  const connections = useConnections()
  const storage = useStorageBrowser(connections.activeConnection)
  const transfers = useTransfers()

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode
  }, [themeMode])

  useEffect(() => {
    void window.api.settings.get<'light' | 'dark'>('theme').then((result) => {
      if (result.ok && result.data) setThemeMode(result.data)
    })
  }, [])

  if (!window.api) {
    return <div className="api-error">Preload API 未加载，请确认当前页面运行在 Electron 窗口中。</div>
  }

  const handleSelectConnection = (connection: (typeof connections.connections)[0]): void => {
    connections.select(connection)
    setActivePage('storage')
  }

  const handleUpload = async (): Promise<void> => {
    const uploadInfo = await storage.uploadObject()
    if (uploadInfo?.tasks) {
      for (const task of uploadInfo.tasks) {
        await transfers.createUpload(task)
      }
      setActivePage('transfers')
    }
  }

  const handleDownload = async (object: StorageObject): Promise<void> => {
    const downloadInfo = await storage.downloadObject(object)
    if (downloadInfo) {
      await transfers.createDownload(downloadInfo)
      setActivePage('transfers')
    }
  }

  const handleDeleteObject = async (object: StorageObject): Promise<void> => {
    await storage.deleteObject(object)
    setSelectedObject(undefined)
  }

  const handleRenameObject = async (object: StorageObject, newName: string): Promise<void> => {
    await storage.renameObject(object, newName)
    setSelectedObject(undefined)
  }

  useKeyboardShortcuts({
    selectedObject,
    onDelete: (obj) => void handleDeleteObject(obj),
    onRename: (obj) => {
      // Trigger rename dialog via a custom event that ObjectTable listens to
      const event = new CustomEvent('object-rename', { detail: obj })
      document.dispatchEvent(event)
    },
    onBack: storage.activeBucket ? storage.backToBuckets : () => {},
    enabled: activePage === 'storage'
  })

  const sidebar = useMemo(
    () => (
      <ConnectionList
        connections={connections.connections}
        activeConnectionId={connections.activeConnection?.id}
        loading={connections.loading}
        onRefresh={connections.load}
        onCreate={() => connections.setModalOpen(true)}
        onTest={(connection) => void connections.test(connection)}
        onDelete={(connection) => connections.remove(connection)}
        onSelect={handleSelectConnection}
      />
    ),
    [connections.connections, connections.activeConnection?.id, connections.loading]
  )

  const storageContent = storage.activeBucket ? (
    <ObjectTable
      connectionId={connections.activeConnection?.id}
      bucket={storage.activeBucket}
      prefix={storage.prefix}
      objects={storage.objectsResult?.objects ?? []}
      prefixes={storage.objectsResult?.prefixes ?? []}
      loading={storage.loadingObjects}
      buckets={storage.buckets}
      onOpenPrefix={storage.setPrefix}
      onUpload={() => void handleUpload()}
      onDownload={(object) => void handleDownload(object)}
      onDelete={(object) => void handleDeleteObject(object)}
      onPresign={(object) => void storage.createPresignedUrl(object)}
      onBackToBuckets={storage.backToBuckets}
      onCreateFolder={(name) => void storage.createFolder(name)}
      onRename={(object, newName) => void handleRenameObject(object, newName)}
      onCopy={(object, targetBucket, targetPrefix) => void storage.copyObjectTo(object, targetBucket, targetPrefix)}
      onMove={(object, targetBucket, targetPrefix) => void storage.moveObjectTo(object, targetBucket, targetPrefix)}
      selectedObject={selectedObject}
      onSelectObject={setSelectedObject}
    />
  ) : (
    <BucketTable
      buckets={storage.buckets}
      loading={storage.loadingBuckets}
      hasConnection={Boolean(connections.activeConnection)}
      onCreate={() => void storage.createBucket()}
      onDelete={(bucket) => storage.deleteBucket(bucket)}
      onOpen={storage.openBucket}
    />
  )

  const pageContent = {
    overview: (
      <>
        <PageHeader title="总览" description="快速了解连接、Bucket 和传输任务状态。" />
        <OverviewCards
          connectionCount={connections.connections.length}
          bucketCount={storage.buckets.length}
          transferCount={transfers.transfers.length}
          recentTransfers={transfers.transfers.slice(0, 5)}
          connections={connections.connections}
          onNavigate={setActivePage}
          onCreateConnection={() => connections.setModalOpen(true)}
        />
      </>
    ),
    storage: (
      <>
        <PageHeader
          title="对象存储"
          description="浏览 Bucket、管理对象、创建预签名链接并启动上传下载任务。"
          extra={<Button onClick={storage.loadBuckets}>刷新</Button>}
        />
        {storageContent}
      </>
    ),
    transfers: (
      <>
        <PageHeader title="传输中心" description="查看上传下载任务状态、错误和历史记录。" extra={<Button onClick={transfers.load}>刷新</Button>} />
        <TransferPanel
          tasks={transfers.transfers}
          onPause={(task) => void transfers.pause(task)}
          onResume={(task) => void transfers.resume(task)}
          onCancel={(task) => void transfers.cancel(task)}
          onRetry={(task) => void transfers.retry(task)}
          onOpenFile={(task) => void transfers.openFile(task)}
          onDeleteFile={(task) => transfers.deleteFile(task)}
        />
      </>
    ),
    settings: (
      <>
        <PageHeader title="设置" description="配置传输偏好、安全策略和应用行为。" />
        <SettingsPage themeMode={themeMode} onThemeChange={setThemeMode} />
      </>
    )
  } satisfies Record<AppPage, React.ReactNode>

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorInfo: '#06b6d4',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 16,
          borderRadiusLG: 20,
          borderRadiusSM: 10,
          fontSize: 14,
          fontSizeLG: 16,
          fontSizeHeading4: 20,
          fontSizeHeading3: 24,
          colorBgContainer: themeMode === 'dark' ? '#1a1a2e' : '#ffffff',
          colorBgElevated: themeMode === 'dark' ? '#16213e' : '#ffffff',
          colorBgLayout: themeMode === 'dark' ? '#0f0f23' : '#f5f6f8',
          colorBorder: themeMode === 'dark' ? '#2d2d44' : '#e8eaed',
          colorBorderSecondary: themeMode === 'dark' ? '#252540' : '#f0f1f3',
          colorText: themeMode === 'dark' ? '#e2e8f0' : '#1a1a1a',
          colorTextSecondary: themeMode === 'dark' ? '#94a3b8' : '#6b7280',
          colorTextTertiary: themeMode === 'dark' ? '#64748b' : '#9ca3af',
          boxShadow: themeMode === 'dark' ? '0 2px 12px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 0, 0, 0.4)' : '0 2px 12px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.06)',
          boxShadowSecondary: themeMode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0, 0, 0, 0.06)',
          fontFamily: "'Mi Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
        }
      }}
    >
      <AntApp>
        <ErrorBoundary>
          <MainLayout activePage={activePage} sidebar={sidebar} onPageChange={setActivePage}>
            <Space direction="vertical" size={20} className="content-stack">
              {pageContent[activePage]}
            </Space>
          </MainLayout>
          <ConnectionModal open={connections.modalOpen} onCancel={() => connections.setModalOpen(false)} onSubmit={connections.create} />
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
