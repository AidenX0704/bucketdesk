import {
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  ProfileOutlined,
  ScissorOutlined,
  TableOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { Breadcrumb, Button, Card, Divider, Dropdown, Empty, Input, Modal, Popconfirm, Select, Segmented, Space, Spin, Table, Tooltip, Typography, message } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { BucketInfo } from '../../../../shared/types/bucket'
import type { ObjectPreviewResult, StorageObject } from '../../../../shared/types/object'

type ViewMode = 'detail' | 'icon'

interface ContextMenuState {
  object: StorageObject
  x: number
  y: number
}

interface CopyMoveState {
  object: StorageObject
  mode: 'copy' | 'move'
}

interface ObjectTableProps {
  connectionId?: string
  bucket?: string
  prefix: string
  objects: StorageObject[]
  prefixes: string[]
  loading: boolean
  buckets: BucketInfo[]
  onOpenPrefix: (prefix: string) => void
  onUpload: () => void
  onDownload: (object: StorageObject) => void
  onDelete: (object: StorageObject) => void
  onPresign: (object: StorageObject) => void
  onBackToBuckets: () => void
  onCreateFolder: (name: string) => void
  onRename: (object: StorageObject, newName: string) => void
  onCopy: (object: StorageObject, targetBucket: string, targetPrefix: string) => void
  onMove: (object: StorageObject, targetBucket: string, targetPrefix: string) => void
  selectedObject?: StorageObject
  onSelectObject: (object: StorageObject | undefined) => void
}

const previewExtensions = new Set([
  'doc',
  'docx',
  'xls',
  'xlsx',
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'bmp',
  'yml',
  'yaml',
  'txt',
  'md',
  'json',
  'xml',
  'csv',
  'log'
])

const getObjectName = (key: string, currentPrefix: string): string => key.replace(currentPrefix, '') || key

const getExtension = (key: string): string => {
  const name = key.split('/').pop() ?? key
  const dotIndex = name.lastIndexOf('.')
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : ''
}

const canPreview = (object: StorageObject): boolean => !object.isPrefix && previewExtensions.has(getExtension(object.key))

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const precision = exponent === 0 || value >= 100 ? 0 : 1

  return `${value.toFixed(precision)} ${units[exponent]}`
}

const getFileIcon = (object: StorageObject): React.ReactNode => {
  if (object.isPrefix) return <FolderOpenOutlined className="object-icon folder-icon" />

  const extension = getExtension(object.key)

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return <FileImageOutlined className="object-icon image-icon" />
  }

  if (extension === 'pdf') return <FilePdfOutlined className="object-icon pdf-icon" />
  if (['doc', 'docx'].includes(extension)) return <FileWordOutlined className="object-icon word-icon" />
  if (['xls', 'xlsx'].includes(extension)) return <FileExcelOutlined className="object-icon excel-icon" />
  if (['txt', 'md', 'json', 'xml', 'csv', 'log', 'yaml', 'yml'].includes(extension)) {
    return <FileTextOutlined className="object-icon text-icon" />
  }

  return <FileOutlined className="object-icon file-icon" />
}

const buildBreadcrumbItems = (
  bucket: string,
  prefix: string,
  onBackToBuckets: () => void,
  onOpenPrefix: (nextPrefix: string) => void
): Parameters<typeof Breadcrumb>[0]['items'] => {
  const segments = prefix.split('/').filter(Boolean)
  const items: Parameters<typeof Breadcrumb>[0]['items'] = [
    {
      title: <Typography.Link onClick={onBackToBuckets}>Bucket</Typography.Link>
    },
    {
      title: <Typography.Link onClick={() => onOpenPrefix('')}>{bucket}</Typography.Link>
    }
  ]

  let currentPrefix = ''
  segments.forEach((segment, index) => {
    currentPrefix += `${segment}/`
    const nextPrefix = currentPrefix
    const isLast = index === segments.length - 1
    items.push({
      title: isLast ? segment : <Typography.Link onClick={() => onOpenPrefix(nextPrefix)}>{segment}</Typography.Link>
    })
  })

  return items
}

export function ObjectTable({
  connectionId,
  bucket,
  prefix,
  objects,
  prefixes,
  loading,
  buckets,
  onOpenPrefix,
  onUpload,
  onDownload,
  onDelete,
  onPresign,
  onBackToBuckets,
  onCreateFolder,
  onRename,
  onCopy,
  onMove,
  selectedObject,
  onSelectObject
}: ObjectTableProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('detail')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<ObjectPreviewResult>()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>()
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [copyMoveState, setCopyMoveState] = useState<CopyMoveState>()

  const rows: StorageObject[] = useMemo(
    () => [...prefixes.map((key) => ({ key, size: 0, isPrefix: true })), ...objects],
    [objects, prefixes]
  )

  const breadcrumbItems = useMemo(
    () => (bucket ? buildBreadcrumbItems(bucket, prefix, onBackToBuckets, onOpenPrefix) : []),
    [bucket, onBackToBuckets, onOpenPrefix, prefix]
  )

  const previewObject = async (object: StorageObject): Promise<void> => {
    if (!connectionId || !bucket || object.isPrefix || !canPreview(object)) return

    setPreviewOpen(true)
    setPreviewLoading(true)
    setPreview(undefined)

    const result = await window.api.storage.previewObject({ connectionId, bucket, key: object.key })
    setPreviewLoading(false)

    if (result.ok) {
      setPreview(result.data)
      return
    }

    setPreviewOpen(false)
    message.error(result.error.message)
  }

  const openContextMenu = (event: React.MouseEvent, object: StorageObject): void => {
    event.preventDefault()
    setContextMenu({ object, x: event.clientX, y: event.clientY })
  }

  const closeContextMenu = (): void => setContextMenu(undefined)

  const contextMenuItems: MenuProps['items'] = contextMenu?.object.isPrefix
    ? [
        {
          key: 'open',
          icon: <FolderOpenOutlined />,
          label: '打开'
        },
        {
          type: 'divider'
        },
        {
          key: 'rename',
          icon: <EditOutlined />,
          label: '重命名'
        },
        {
          key: 'copy',
          icon: <CopyOutlined />,
          label: '复制到'
        },
        {
          key: 'move',
          icon: <ScissorOutlined />,
          label: '移动到'
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true
        }
      ]
    : [
        {
          key: 'preview',
          icon: <EyeOutlined />,
          label: '预览',
          disabled: !contextMenu || !canPreview(contextMenu.object)
        },
        {
          key: 'download',
          icon: <DownloadOutlined />,
          label: '下载'
        },
        {
          key: 'presign',
          icon: <LinkOutlined />,
          label: '复制预签名链接'
        },
        {
          type: 'divider'
        },
        {
          key: 'rename',
          icon: <EditOutlined />,
          label: '重命名'
        },
        {
          key: 'copy',
          icon: <CopyOutlined />,
          label: '复制到'
        },
        {
          key: 'move',
          icon: <ScissorOutlined />,
          label: '移动到'
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: '删除',
          danger: true
        }
      ]

  const handleContextMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!contextMenu) return

    const { object } = contextMenu
    closeContextMenu()

    if (key === 'open') onOpenPrefix(object.key)
    if (key === 'preview') void previewObject(object)
    if (key === 'download') onDownload(object)
    if (key === 'presign') onPresign(object)
    if (key === 'rename') showRenameDialog(object)
    if (key === 'copy') setCopyMoveState({ object, mode: 'copy' })
    if (key === 'move') setCopyMoveState({ object, mode: 'move' })
    if (key === 'delete') {
      const fileName = getObjectName(object.key, prefix)
      Modal.confirm({
        centered: true,
        title: '确认删除',
        content: `确定要删除 "${fileName}" 吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: () => onDelete(object)
      })
    }
  }

  const showRenameDialog = (object: StorageObject): void => {
    const currentName = object.isPrefix
      ? getObjectName(object.key, prefix).replace(/\/$/, '')
      : getObjectName(object.key, prefix)
    let newName = currentName

    Modal.confirm({
      centered: true,
      title: '重命名',
      content: (
        <Input
          defaultValue={currentName}
          onChange={(event) => (newName = event.target.value)}
          onPressEnter={() => {
            const modal = Modal.confirm({})
            modal.destroy()
          }}
        />
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        if (!newName || newName === currentName) return
        onRename(object, newName)
      }
    })
  }

  useEffect(() => {
    const handleRenameEvent = (event: Event): void => {
      const object = (event as CustomEvent<StorageObject>).detail
      if (object) showRenameDialog(object)
    }
    document.addEventListener('object-rename', handleRenameEvent)
    return () => document.removeEventListener('object-rename', handleRenameEvent)
  }, [showRenameDialog])

  const handleCreateFolder = (): void => {
    let folderName = ''
    Modal.confirm({
      centered: true,
      title: '新建文件夹',
      content: (
        <Input
          placeholder="文件夹名称"
          onChange={(event) => (folderName = event.target.value)}
        />
      ),
      okText: '创建',
      cancelText: '取消',
      onOk: () => {
        if (!folderName) return
        onCreateFolder(folderName)
      }
    })
  }

  const columns: ColumnsType<StorageObject> = [
    {
      title: '名称',
      dataIndex: 'key',
      key: 'key',
      render: (key, object) => (
        <Space>
          {getFileIcon(object)}
          {object.isPrefix ? (
            <Typography.Link onClick={() => onOpenPrefix(object.key)}>
              {getObjectName(key, prefix)}
            </Typography.Link>
          ) : (
            <Typography.Link disabled={!canPreview(object)} onClick={() => void previewObject(object)}>
              {getObjectName(key, prefix)}
            </Typography.Link>
          )}
        </Space>
      )
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size, object) => (object.isPrefix ? '-' : formatFileSize(size))
    },
    {
      title: '更新时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 220,
      render: (value) => value || '-'
    }
  ]

  const renderPreview = (): React.ReactNode => {
    if (previewLoading) return <Spin tip="正在加载预览..." />
    if (!preview) return <Empty description="暂无预览内容" />

    if (preview.previewType === 'image' && preview.dataUrl) {
      return <img className="object-preview-image" src={preview.dataUrl} alt={preview.fileName} />
    }

    if (preview.previewType === 'pdf' && preview.dataUrl) {
      return <iframe className="object-preview-frame" title={preview.fileName} src={preview.dataUrl} />
    }

    if (preview.previewType === 'text') {
      return <pre className="object-preview-text">{preview.text}</pre>
    }

    if (preview.previewType === 'office' && preview.officeUrl) {
      return (
        <Space direction="vertical" className="content-stack">
          <Typography.Text type="secondary">{preview.message}</Typography.Text>
          <iframe className="object-preview-frame" title={preview.fileName} src={preview.officeUrl} />
        </Space>
      )
    }

    return <Empty description={preview.message ?? '当前格式暂不支持预览'} />
  }

  return (
    <Card
      title="对象浏览"
      className="surface-card"
      extra={
        <Space size={8}>
          <Segmented<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { label: '详细', value: 'detail', icon: <TableOutlined /> },
              { label: '图标', value: 'icon', icon: <ProfileOutlined /> }
            ]}
          />
          <Tooltip title={detailPanelOpen ? '隐藏详情' : '显示详情'}>
            <Button
              icon={<InfoCircleOutlined />}
              type={detailPanelOpen ? 'primary' : 'default'}
              onClick={() => setDetailPanelOpen(!detailPanelOpen)}
            />
          </Tooltip>
          <Button icon={<CopyOutlined />} onClick={onBackToBuckets}>
            Bucket
          </Button>
          <Button icon={<FolderAddOutlined />} onClick={handleCreateFolder} disabled={!bucket}>
            新建文件夹
          </Button>
          <Button icon={<UploadOutlined />} type="primary" onClick={onUpload} disabled={!bucket}>
            上传文件
          </Button>
        </Space>
      }
    >
      {bucket ? (
        <Space direction="vertical" className="content-stack object-browser-stack">
          <Breadcrumb items={breadcrumbItems} />
          <div className="object-browser-layout">
            <div className="object-browser-main">
              {viewMode === 'detail' ? (
                <div className="table-scroll">
                  <Table
                    rowKey="key"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    pagination={false}
                    rowClassName={(object) =>
                      `object-table-row${selectedObject?.key === object.key ? ' object-table-row-selected' : ''}`
                    }
                    onRow={(object) => ({
                      onClick: () => onSelectObject(object),
                      onContextMenu: (event) => openContextMenu(event, object),
                      onDoubleClick: () => {
                        if (object.isPrefix) onOpenPrefix(object.key)
                        else void previewObject(object)
                      }
                    })}
                  />
                </div>
              ) : (
                <Spin spinning={loading}>
                  {rows.length > 0 ? (
                    <div className="object-grid">
                      {rows.map((object) => (
                        <Card
                          key={object.key}
                          className={`object-grid-card${selectedObject?.key === object.key ? ' object-grid-card-selected' : ''}`}
                          hoverable
                          onContextMenu={(event) => openContextMenu(event, object)}
                          onClick={() => {
                            onSelectObject(object)
                            if (object.isPrefix) onOpenPrefix(object.key)
                          }}
                          onDoubleClick={() => {
                            if (!object.isPrefix) void previewObject(object)
                          }}
                        >
                          <Space direction="vertical" align="center" size={8} className="object-grid-card-content">
                            {getFileIcon(object)}
                            <Typography.Text title={object.key} className="object-grid-name">
                              {getObjectName(object.key, prefix)}
                            </Typography.Text>
                            <Typography.Text type="secondary">
                              {object.isPrefix ? '文件夹' : formatFileSize(object.size)}
                            </Typography.Text>
                          </Space>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description="当前目录暂无对象" />
                  )}
                </Spin>
              )}
            </div>
            {detailPanelOpen && (
              <div className="detail-panel">
                <div className="detail-panel-header">
                  <Typography.Text strong style={{ fontSize: 14 }}>详细信息</Typography.Text>
                  <Button type="text" size="small" icon={<CloseOutlined />} onClick={() => setDetailPanelOpen(false)} />
                </div>
                {selectedObject ? (
                  <div className="detail-panel-body">
                    <div className="detail-panel-icon">
                      {selectedObject.isPrefix ? (
                        <FolderOpenOutlined className="detail-icon-large folder-icon" />
                      ) : (
                        <span className="detail-icon-large-wrap">{getFileIcon(selectedObject)}</span>
                      )}
                    </div>
                    <Typography.Text strong className="detail-panel-filename">
                      {getObjectName(selectedObject.key, prefix)}
                    </Typography.Text>
                    <Typography.Text type="secondary" className="detail-panel-type">
                      {selectedObject.isPrefix ? '文件夹' : `${getExtension(selectedObject.key).toUpperCase() || '文件'}`}
                    </Typography.Text>

                    <Divider className="detail-divider" />

                    <div className="detail-items">
                      <div className="detail-item">
                        <Typography.Text type="secondary" className="detail-label">完整路径</Typography.Text>
                        <Tooltip title={selectedObject.key}>
                          <Typography.Text className="detail-value" ellipsis>{selectedObject.key}</Typography.Text>
                        </Tooltip>
                      </div>
                      {!selectedObject.isPrefix && (
                        <>
                          <div className="detail-item">
                            <Typography.Text type="secondary" className="detail-label">大小</Typography.Text>
                            <Typography.Text className="detail-value">{formatFileSize(selectedObject.size)}</Typography.Text>
                          </div>
                          {selectedObject.lastModified && (
                            <div className="detail-item">
                              <Typography.Text type="secondary" className="detail-label">修改时间</Typography.Text>
                              <Typography.Text className="detail-value">{selectedObject.lastModified}</Typography.Text>
                            </div>
                          )}
                          {selectedObject.storageClass && (
                            <div className="detail-item">
                              <Typography.Text type="secondary" className="detail-label">存储类型</Typography.Text>
                              <Typography.Text className="detail-value">{selectedObject.storageClass}</Typography.Text>
                            </div>
                          )}
                          {selectedObject.etag && (
                            <div className="detail-item">
                              <Typography.Text type="secondary" className="detail-label">ETag</Typography.Text>
                              <Tooltip title={selectedObject.etag}>
                                <Typography.Text className="detail-value" ellipsis>{selectedObject.etag}</Typography.Text>
                              </Tooltip>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {!selectedObject.isPrefix && (
                      <>
                        <Divider className="detail-divider" />
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          {canPreview(selectedObject) && (
                            <Button icon={<EyeOutlined />} block onClick={() => void previewObject(selectedObject)}>
                              预览
                            </Button>
                          )}
                          <Button icon={<DownloadOutlined />} block onClick={() => onDownload(selectedObject)}>
                            下载
                          </Button>
                          <Button icon={<LinkOutlined />} block onClick={() => onPresign(selectedObject)}>
                            复制链接
                          </Button>
                          <Button icon={<EditOutlined />} block onClick={() => showRenameDialog(selectedObject)}>
                            重命名
                          </Button>
                          <Button icon={<CopyOutlined />} block onClick={() => setCopyMoveState({ object: selectedObject, mode: 'copy' })}>
                            复制到
                          </Button>
                          <Button icon={<ScissorOutlined />} block onClick={() => setCopyMoveState({ object: selectedObject, mode: 'move' })}>
                            移动到
                          </Button>
                          <Popconfirm
                            title="确认删除"
                            description="此操作不可恢复。"
                            okText="删除"
                            okButtonProps={{ danger: true }}
                            cancelText="取消"
                            placement="top"
                            onConfirm={() => onDelete(selectedObject)}
                          >
                            <Button danger icon={<DeleteOutlined />} block>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </>
                    )}
                    {selectedObject.isPrefix && (
                      <>
                        <Divider className="detail-divider" />
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Button icon={<EditOutlined />} block onClick={() => showRenameDialog(selectedObject)}>
                            重命名
                          </Button>
                          <Button icon={<CopyOutlined />} block onClick={() => setCopyMoveState({ object: selectedObject, mode: 'copy' })}>
                            复制到
                          </Button>
                          <Button icon={<ScissorOutlined />} block onClick={() => setCopyMoveState({ object: selectedObject, mode: 'move' })}>
                            移动到
                          </Button>
                          <Popconfirm
                            title="确认删除"
                            description="删除文件夹将同时删除其中所有内容。"
                            okText="删除"
                            okButtonProps={{ danger: true }}
                            cancelText="取消"
                            placement="top"
                            onConfirm={() => onDelete(selectedObject)}
                          >
                            <Button danger icon={<DeleteOutlined />} block>
                              删除
                            </Button>
                          </Popconfirm>
                        </Space>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="detail-panel-empty">
                    <InfoCircleOutlined style={{ fontSize: 24, color: 'var(--text-tertiary)', marginBottom: 8 }} />
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>点击文件查看详细信息</Typography.Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </Space>
      ) : (
        <Empty description="请选择 Bucket 后查看对象" />
      )}

      <Modal
        open={previewOpen}
        title={preview?.fileName ?? '文件预览'}
        width="80vw"
        centered
        footer={
          preview ? (
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => onDownload({ key: preview.key, size: preview.size })}>
                下载
              </Button>
              <Button icon={<LinkOutlined />} onClick={() => onPresign({ key: preview.key, size: preview.size })}>
                链接
              </Button>
              <Popconfirm
                title="确认删除"
                description={`确定要删除文件 "${preview.fileName}" 吗？此操作不可恢复。`}
                okText="删除"
                okButtonProps={{ danger: true }}
                cancelText="取消"
                placement="top"
                align={{ offset: [0, 0] }}
                onConfirm={() => {
                  setPreviewOpen(false)
                  onDelete({ key: preview.key, size: preview.size })
                }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          ) : null
        }
        onCancel={() => setPreviewOpen(false)}
        destroyOnHidden
      >
        <div className="object-preview-meta">
          {preview && (
            <Space wrap>
              <Typography.Text type="secondary">类型：{preview.contentType || preview.extension || '-'}</Typography.Text>
              <Typography.Text type="secondary">大小：{formatFileSize(preview.size)}</Typography.Text>
            </Space>
          )}
        </div>
        <div className="object-preview-body">{renderPreview()}</div>
      </Modal>
      <CopyMoveModal
        state={copyMoveState}
        buckets={buckets}
        currentBucket={bucket ?? ''}
        onConfirm={(targetBucket, targetPrefix) => {
          if (!copyMoveState) return
          if (copyMoveState.mode === 'copy') onCopy(copyMoveState.object, targetBucket, targetPrefix)
          else onMove(copyMoveState.object, targetBucket, targetPrefix)
          setCopyMoveState(undefined)
        }}
        onCancel={() => setCopyMoveState(undefined)}
      />
      <Dropdown
        open={Boolean(contextMenu)}
        menu={{ items: contextMenuItems, onClick: handleContextMenuClick }}
        trigger={['contextMenu']}
        onOpenChange={(open) => {
          if (!open) closeContextMenu()
        }}
      >
        <div
          className="object-context-anchor"
          style={{ left: contextMenu?.x ?? 0, top: contextMenu?.y ?? 0 }}
        />
      </Dropdown>
    </Card>
  )
}

interface CopyMoveModalProps {
  state: CopyMoveState | undefined
  buckets: BucketInfo[]
  currentBucket: string
  onConfirm: (targetBucket: string, targetPrefix: string) => void
  onCancel: () => void
}

function CopyMoveModal({ state, buckets, currentBucket, onConfirm, onCancel }: CopyMoveModalProps): React.JSX.Element {
  const [targetBucket, setTargetBucket] = useState(currentBucket)
  const [targetPrefix, setTargetPrefix] = useState('')

  const open = Boolean(state)
  const title = state?.mode === 'copy' ? '复制到' : '移动到'
  const fileName = state ? (state.object.key.split('/').pop() ?? state.object.key) : ''

  return (
    <Modal
      open={open}
      title={title}
      centered
      okText="确定"
      cancelText="取消"
      onOk={() => onConfirm(targetBucket, targetPrefix)}
      onCancel={onCancel}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible) {
          setTargetBucket(currentBucket)
          setTargetPrefix('')
        }
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Typography.Text type="secondary">源文件</Typography.Text>
          <div><Typography.Text strong>{fileName}</Typography.Text></div>
        </div>
        <div>
          <Typography.Text type="secondary">目标 Bucket</Typography.Text>
          <Select
            value={targetBucket}
            onChange={setTargetBucket}
            style={{ width: '100%', marginTop: 4 }}
            options={buckets.map((b) => ({ label: b.name, value: b.name }))}
          />
        </div>
        <div>
          <Typography.Text type="secondary">目标路径前缀</Typography.Text>
          <Input
            placeholder="例如：folder/subfolder/"
            value={targetPrefix}
            onChange={(event) => setTargetPrefix(event.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
      </Space>
    </Modal>
  )
}
