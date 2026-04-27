import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  ProfileOutlined,
  TableOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { Breadcrumb, Button, Card, Dropdown, Empty, Modal, Segmented, Space, Spin, Table, Typography, message } from 'antd'
import type { MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import type { ObjectPreviewResult, StorageObject } from '../../../../shared/types/object'

type ViewMode = 'detail' | 'icon'

interface ContextMenuState {
  object: StorageObject
  x: number
  y: number
}

interface ObjectTableProps {
  connectionId?: string
  bucket?: string
  prefix: string
  objects: StorageObject[]
  prefixes: string[]
  loading: boolean
  onOpenPrefix: (prefix: string) => void
  onUpload: () => void
  onDownload: (object: StorageObject) => void
  onDelete: (object: StorageObject) => void
  onPresign: (object: StorageObject) => void
  onBackToBuckets: () => void
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
  onOpenPrefix,
  onUpload,
  onDownload,
  onDelete,
  onPresign,
  onBackToBuckets
}: ObjectTableProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('detail')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<ObjectPreviewResult>()
  const [contextMenu, setContextMenu] = useState<ContextMenuState>()

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
    if (key === 'delete') onDelete(object)
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
      extra={
        <Space>
          <Segmented<ViewMode>
            value={viewMode}
            onChange={setViewMode}
            options={[
              { label: '详细', value: 'detail', icon: <TableOutlined /> },
              { label: '图标', value: 'icon', icon: <ProfileOutlined /> }
            ]}
          />
          <Button icon={<CopyOutlined />} onClick={onBackToBuckets}>
            Bucket
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
          {viewMode === 'detail' ? (
            <Table
              rowKey="key"
              columns={columns}
              dataSource={rows}
              loading={loading}
              pagination={false}
              rowClassName="object-table-row"
              onRow={(object) => ({
                onContextMenu: (event) => openContextMenu(event, object),
                onDoubleClick: () => {
                  if (object.isPrefix) onOpenPrefix(object.key)
                  else void previewObject(object)
                }
              })}
            />
          ) : (
            <Spin spinning={loading}>
              {rows.length > 0 ? (
                <div className="object-grid">
                  {rows.map((object) => (
                    <Card
                      key={object.key}
                      className="object-grid-card"
                      hoverable
                      onContextMenu={(event) => openContextMenu(event, object)}
                      onClick={() => {
                        if (object.isPrefix) onOpenPrefix(object.key)
                        else void previewObject(object)
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
        </Space>
      ) : (
        <Empty description="请选择 Bucket 后查看对象" />
      )}

      <Modal
        open={previewOpen}
        title={preview?.fileName ?? '文件预览'}
        width="80vw"
        footer={
          preview ? (
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => onDownload({ key: preview.key, size: preview.size })}>
                下载
              </Button>
              <Button icon={<LinkOutlined />} onClick={() => onPresign({ key: preview.key, size: preview.size })}>
                链接
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => onDelete({ key: preview.key, size: preview.size })}>
                删除
              </Button>
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
