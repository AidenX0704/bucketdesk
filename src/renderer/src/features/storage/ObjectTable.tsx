import {
  ArrowClockwiseIcon,
  CopySimpleIcon,
  DatabaseIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FileCodeIcon,
  FileCsvIcon,
  FileDocIcon,
  FileHtmlIcon,
  FileIcon,
  FileImageIcon,
  FileMagnifyingGlassIcon,
  FileMdIcon,
  FilePdfIcon,
  FilePngIcon,
  FilePptIcon,
  FileTextIcon,
  FileTsIcon,
  FileTxtIcon,
  FileXlsIcon,
  FileZipIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  InfoIcon,
  LinkBreakIcon,
  LinkSimpleIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  ScissorsIcon,
  SquaresFourIcon,
  TrashSimpleIcon,
  UploadSimpleIcon,
  XIcon
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import {
  Breadcrumb,
  Button,
  Dropdown,
  Empty,
  Input,
  InputNumber,
  Modal,
  Select,
  Segmented,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd'
import type { BreadcrumbProps, MenuProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { BucketInfo } from '../../../../shared/types/bucket'
import type { ObjectPreviewResult, StorageObject } from '../../../../shared/types/object'

type ViewMode = 'detail' | 'icon'
type InspectorMode = 'info' | 'preview'
type ShareExpiryPreset = '3600' | '43200' | '86400' | '604800' | 'custom'
type FileIconTone =
  | 'folder'
  | 'image'
  | 'pdf'
  | 'word'
  | 'excel'
  | 'code'
  | 'archive'
  | 'text'
  | 'slides'
  | 'default'

interface ContextMenuState {
  object: StorageObject
  x: number
  y: number
}

interface CopyMoveState {
  object: StorageObject
  mode: 'copy' | 'move'
}

interface ShareLinkRecord {
  id: string
  connectionId: string
  bucket: string
  key: string
  objectName: string
  url: string
  expiresInSeconds: number
  expiresAt: string
  createdAt: string
  openedAt?: string
  openCount: number
}

interface ObjectTableProps {
  connectionId?: string
  bucket?: string
  prefix: string
  objects: StorageObject[]
  prefixes: string[]
  loading: boolean
  buckets: BucketInfo[]
  loadingBuckets: boolean
  onOpenBucket: (bucket: BucketInfo) => void
  onCreateBucket: () => void
  onDeleteBucket: (bucket: BucketInfo) => void
  onOpenPrefix: (prefix: string) => void
  onUpload: () => void
  onDownload: (object: StorageObject) => void
  onDelete: (object: StorageObject) => void
  onBackToBuckets: () => void
  onCreateFolder: (name: string) => void
  onRename: (object: StorageObject, newName: string) => void
  onCopy: (object: StorageObject, targetBucket: string, targetPrefix: string) => void
  onMove: (object: StorageObject, targetBucket: string, targetPrefix: string) => void
  onRefreshBuckets: () => void
  onRefreshObjects: () => void
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

const textPreviewTypes = new Set(['text', 'unsupported'])
const shareLinksSettingsKey = 'storage.shareLinks'

const shareExpiryOptions: Array<{ label: string; value: ShareExpiryPreset }> = [
  { label: '1 小时', value: '3600' },
  { label: '12 小时', value: '43200' },
  { label: '1 天', value: '86400' },
  { label: '7 天', value: '604800' },
  { label: '自定义', value: 'custom' }
]

const getObjectName = (key: string, currentPrefix: string): string =>
  key.replace(currentPrefix, '') || key

const getExtension = (key: string): string => {
  const name = key.split('/').pop() ?? key
  const dotIndex = name.lastIndexOf('.')
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : ''
}

const getReadableType = (object: StorageObject): string => {
  if (object.isPrefix) return '文件夹'
  const extension = getExtension(object.key)
  return extension ? extension.toUpperCase() : '文件'
}

const canPreview = (object: StorageObject): boolean =>
  !object.isPrefix && previewExtensions.has(getExtension(object.key))

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const precision = exponent === 0 || value >= 100 ? 0 : 1

  return `${value.toFixed(precision)} ${units[exponent]}`
}

const formatDateTime = (value?: string): string => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

const formatDuration = (seconds: number): string => {
  if (seconds % 86400 === 0) return `${seconds / 86400} 天`
  if (seconds % 3600 === 0) return `${seconds / 3600} 小时`
  return `${Math.round(seconds / 60)} 分钟`
}

const isShareExpired = (record: ShareLinkRecord): boolean =>
  new Date(record.expiresAt).getTime() <= Date.now()

const createShareId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const getFileIconMeta = (object: StorageObject): { IconComponent: Icon; tone: FileIconTone } => {
  if (object.isPrefix) return { IconComponent: FolderOpenIcon, tone: 'folder' }

  const extension = getExtension(object.key)

  if (['jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension))
    return { IconComponent: FileImageIcon, tone: 'image' }
  if (extension === 'png') return { IconComponent: FilePngIcon, tone: 'image' }
  if (extension === 'svg') return { IconComponent: FileImageIcon, tone: 'image' }
  if (extension === 'pdf') return { IconComponent: FilePdfIcon, tone: 'pdf' }
  if (['doc', 'docx'].includes(extension)) return { IconComponent: FileDocIcon, tone: 'word' }
  if (['xls', 'xlsx'].includes(extension)) return { IconComponent: FileXlsIcon, tone: 'excel' }
  if (extension === 'csv') return { IconComponent: FileCsvIcon, tone: 'excel' }
  if (['ppt', 'pptx'].includes(extension)) return { IconComponent: FilePptIcon, tone: 'slides' }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension))
    return { IconComponent: FileZipIcon, tone: 'archive' }
  if (['json', 'geojson', 'xml', 'yaml', 'yml', 'js', 'jsx', 'ts', 'tsx', 'css', 'html'].includes(extension)) {
    if (extension === 'html') return { IconComponent: FileHtmlIcon, tone: 'code' }
    if (['ts', 'tsx'].includes(extension)) return { IconComponent: FileTsIcon, tone: 'code' }
    return { IconComponent: FileCodeIcon, tone: 'code' }
  }
  if (extension === 'md') return { IconComponent: FileMdIcon, tone: 'text' }
  if (['txt', 'log'].includes(extension)) return { IconComponent: FileTxtIcon, tone: 'text' }
  if (previewExtensions.has(extension)) return { IconComponent: FileTextIcon, tone: 'text' }

  return { IconComponent: FileIcon, tone: 'default' }
}

const getFileIcon = (object: StorageObject): React.ReactNode => {
  const { IconComponent, tone } = getFileIconMeta(object)
  return <IconComponent className={`object-icon ${tone}-icon`} weight="duotone" />
}

const buildBreadcrumbItems = (
  bucket: string,
  prefix: string,
  onBackToBuckets: () => void,
  onOpenPrefix: (nextPrefix: string) => void
): BreadcrumbProps['items'] => {
  const segments = prefix.split('/').filter(Boolean)
  const items: BreadcrumbProps['items'] = [
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
      title: isLast ? (
        segment
      ) : (
        <Typography.Link onClick={() => onOpenPrefix(nextPrefix)}>{segment}</Typography.Link>
      )
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
  loadingBuckets,
  onOpenBucket,
  onCreateBucket,
  onDeleteBucket,
  onOpenPrefix,
  onUpload,
  onDownload,
  onDelete,
  onBackToBuckets,
  onCreateFolder,
  onRename,
  onCopy,
  onMove,
  onRefreshBuckets,
  onRefreshObjects,
  selectedObject,
  onSelectObject
}: ObjectTableProps): React.JSX.Element {
  const [viewMode, setViewMode] = useState<ViewMode>('detail')
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('info')
  const [searchText, setSearchText] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<ObjectPreviewResult>()
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>()
  const [copyMoveState, setCopyMoveState] = useState<CopyMoveState>()
  const [shareLinks, setShareLinks] = useState<ShareLinkRecord[]>([])
  const [shareTarget, setShareTarget] = useState<StorageObject>()
  const [shareManagerOpen, setShareManagerOpen] = useState(false)
  const [shareExpiryPreset, setShareExpiryPreset] = useState<ShareExpiryPreset>('3600')
  const [customShareHours, setCustomShareHours] = useState(24)
  const [shareCreating, setShareCreating] = useState(false)
  const [bucketContextMenu, setBucketContextMenu] = useState<{
    bucket: BucketInfo
    x: number
    y: number
  }>()

  const rows: StorageObject[] = useMemo(
    () => [...prefixes.map((key) => ({ key, size: 0, isPrefix: true })), ...objects],
    [objects, prefixes]
  )

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((object) => getObjectName(object.key, prefix).toLowerCase().includes(query))
  }, [prefix, rows, searchText])

  const breadcrumbItems = useMemo(
    () => (bucket ? buildBreadcrumbItems(bucket, prefix, onBackToBuckets, onOpenPrefix) : []),
    [bucket, onBackToBuckets, onOpenPrefix, prefix]
  )

  const activeBucket = buckets.find((item) => item.name === bucket)
  const selectedCanPreview = selectedObject ? canPreview(selectedObject) : false
  const selectedObjectName = selectedObject ? getObjectName(selectedObject.key, prefix) : ''
  const selectedExtension = selectedObject ? getExtension(selectedObject.key) : ''
  const currentShareLinks = useMemo(
    () =>
      shareLinks.filter(
        (record) => record.connectionId === connectionId && record.bucket === bucket
      ),
    [bucket, connectionId, shareLinks]
  )
  const selectedShareLinks = useMemo(
    () =>
      selectedObject
        ? currentShareLinks.filter((record) => record.key === selectedObject.key)
        : [],
    [currentShareLinks, selectedObject]
  )
  const activeSelectedShareLinks = selectedShareLinks.filter((record) => !isShareExpired(record))

  useEffect(() => {
    if (!selectedObject) return
    if (!rows.some((object) => object.key === selectedObject.key)) onSelectObject(undefined)
  }, [onSelectObject, rows, selectedObject])

  useEffect(() => {
    if (!bucket) setInspectorOpen(false)
  }, [bucket])

  useEffect(() => {
    let cancelled = false
    void window.api.settings.get<ShareLinkRecord[]>(shareLinksSettingsKey).then((result) => {
      if (cancelled) return
      if (result.ok && Array.isArray(result.data)) setShareLinks(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const activePreview = selectedObject && preview?.key === selectedObject.key ? preview : undefined

  const persistShareLinks = async (nextLinks: ShareLinkRecord[]): Promise<void> => {
    setShareLinks(nextLinks)
    const result = await window.api.settings.set(shareLinksSettingsKey, nextLinks)
    if (!result.ok) message.error(result.error.message)
  }

  const showProperties = (object: StorageObject): void => {
    onSelectObject(object)
    setInspectorMode('info')
    setInspectorOpen(true)
  }

  const openShareDialog = (object: StorageObject): void => {
    if (object.isPrefix) return
    onSelectObject(object)
    setShareTarget(object)
    setShareExpiryPreset('3600')
    setCustomShareHours(24)
  }

  const getShareExpirySeconds = (): number => {
    if (shareExpiryPreset === 'custom') return Math.max(1, customShareHours) * 3600
    return Number(shareExpiryPreset)
  }

  const createShareLink = async (): Promise<void> => {
    if (!connectionId || !bucket || !shareTarget) return
    const expiresInSeconds = getShareExpirySeconds()

    setShareCreating(true)
    const result = await window.api.storage.createPresignedUrl({
      connectionId,
      bucket,
      key: shareTarget.key,
      expiresInSeconds
    })
    setShareCreating(false)

    if (!result.ok) {
      message.error(result.error.message)
      return
    }

    const now = new Date()
    const record: ShareLinkRecord = {
      id: createShareId(),
      connectionId,
      bucket,
      key: shareTarget.key,
      objectName: getObjectName(shareTarget.key, prefix),
      url: result.data,
      expiresInSeconds,
      expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
      createdAt: now.toISOString(),
      openCount: 0
    }

    const nextLinks = [record, ...shareLinks]
    await persistShareLinks(nextLinks)
    await navigator.clipboard.writeText(record.url)
    setShareTarget(undefined)
    message.success('分享链接已创建并复制')
  }

  const copyShareUrl = async (record: ShareLinkRecord): Promise<void> => {
    await navigator.clipboard.writeText(record.url)
    message.success('分享链接已复制')
  }

  const openTrackedShareUrl = async (record: ShareLinkRecord): Promise<void> => {
    if (isShareExpired(record)) {
      message.warning('该分享链接已过期')
      return
    }

    const openedAt = new Date().toISOString()
    const nextLinks = shareLinks.map((item) =>
      item.id === record.id
        ? { ...item, openCount: item.openCount + 1, openedAt }
        : item
    )
    await persistShareLinks(nextLinks)
    window.open(record.url, '_blank', 'noopener,noreferrer')
  }

  const removeShareLink = async (record: ShareLinkRecord): Promise<void> => {
    await persistShareLinks(shareLinks.filter((item) => item.id !== record.id))
    message.success('分享记录已移除')
  }

  const previewObject = async (object: StorageObject, openModal = false): Promise<void> => {
    if (!connectionId || !bucket || object.isPrefix || !canPreview(object)) {
      if (object && !object.isPrefix) {
        message.info('当前格式暂不支持预览，请下载后查看。')
      }
      return
    }

    onSelectObject(object)
    setInspectorMode('preview')
    setPreviewLoading(true)
    setPreview(undefined)
    if (openModal) setPreviewOpen(true)

    const result = await window.api.storage.previewObject({ connectionId, bucket, key: object.key })
    setPreviewLoading(false)

    if (result.ok) {
      setPreview(result.data)
      return
    }

    if (openModal) setPreviewOpen(false)
    message.error(result.error.message)
  }

  const openSelected = (object: StorageObject): void => {
    if (object.isPrefix) {
      onOpenPrefix(object.key)
      return
    }
    showProperties(object)
  }

  const openContextMenu = (event: React.MouseEvent, object: StorageObject): void => {
    event.preventDefault()
    onSelectObject(object)
    setContextMenu({ object, x: event.clientX, y: event.clientY })
  }

  const closeContextMenu = (): void => setContextMenu(undefined)
  const closeBucketContextMenu = (): void => setBucketContextMenu(undefined)

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
          aria-label="新名称"
          defaultValue={currentName}
          onChange={(event) => (newName = event.target.value.trim())}
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
  })

  const handleCreateFolder = (): void => {
    let folderName = ''
    Modal.confirm({
      centered: true,
      title: '新建文件夹',
      content: (
        <Input
          aria-label="文件夹名称"
          placeholder="文件夹名称"
          onChange={(event) => (folderName = event.target.value.trim())}
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

  const contextMenuItems: MenuProps['items'] = contextMenu?.object.isPrefix
    ? [
        {
          key: 'open',
          icon: <FolderOpenIcon />,
          label: '打开'
        },
        {
          key: 'properties',
          icon: <InfoIcon />,
          label: '查看属性'
        },
        {
          type: 'divider'
        },
        {
          key: 'rename',
          icon: <PencilSimpleIcon />,
          label: '重命名'
        },
        {
          key: 'copy',
          icon: <CopySimpleIcon />,
          label: '复制到'
        },
        {
          key: 'move',
          icon: <ScissorsIcon />,
          label: '移动到'
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          icon: <TrashSimpleIcon />,
          label: '删除',
          danger: true
        }
      ]
    : [
        {
          key: 'preview',
          icon: <EyeIcon />,
          label: '预览',
          disabled: !contextMenu || !canPreview(contextMenu.object)
        },
        {
          key: 'download',
          icon: <DownloadSimpleIcon />,
          label: '下载'
        },
        {
          key: 'presign',
          icon: <LinkSimpleIcon />,
          label: '分享链接'
        },
        {
          key: 'properties',
          icon: <InfoIcon />,
          label: '查看属性'
        },
        {
          type: 'divider'
        },
        {
          key: 'rename',
          icon: <PencilSimpleIcon />,
          label: '重命名'
        },
        {
          key: 'copy',
          icon: <CopySimpleIcon />,
          label: '复制到'
        },
        {
          key: 'move',
          icon: <ScissorsIcon />,
          label: '移动到'
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          icon: <TrashSimpleIcon />,
          label: '删除',
          danger: true
        }
      ]

  const bucketContextMenuItems: MenuProps['items'] = [
    {
      key: 'open',
      icon: <FolderOpenIcon />,
      label: '打开'
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      icon: <TrashSimpleIcon />,
      label: '删除 Bucket',
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
    if (key === 'presign') openShareDialog(object)
    if (key === 'properties') showProperties(object)
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

  const handleBucketContextMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!bucketContextMenu) return
    const { bucket: targetBucket } = bucketContextMenu
    closeBucketContextMenu()

    if (key === 'open') onOpenBucket(targetBucket)
    if (key === 'delete') onDeleteBucket(targetBucket)
  }

  const handleBrowserKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (!selectedObject) return

    if (event.key === 'Enter') {
      event.preventDefault()
      openSelected(selectedObject)
      return
    }

    if (event.key === ' ') {
      event.preventDefault()
      if (!selectedObject.isPrefix) void previewObject(selectedObject)
    }
  }

  const selectedMoreMenuItems: MenuProps['items'] = selectedObject
    ? [
        {
          key: 'rename',
          icon: <PencilSimpleIcon />,
          label: '重命名'
        },
        {
          key: 'copy',
          icon: <CopySimpleIcon />,
          label: '复制到'
        },
        {
          key: 'move',
          icon: <ScissorsIcon />,
          label: '移动到'
        },
        {
          key: 'properties',
          icon: <InfoIcon />,
          label: '查看属性'
        },
        {
          type: 'divider'
        },
        {
          key: 'delete',
          icon: <TrashSimpleIcon />,
          label: '删除',
          danger: true
        }
      ]
    : []

  const handleSelectedMoreMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!selectedObject) return

    if (key === 'rename') showRenameDialog(selectedObject)
    if (key === 'copy') setCopyMoveState({ object: selectedObject, mode: 'copy' })
    if (key === 'move') setCopyMoveState({ object: selectedObject, mode: 'move' })
    if (key === 'properties') showProperties(selectedObject)
    if (key === 'delete') {
      Modal.confirm({
        centered: true,
        title: '确认删除',
        content: `确定要删除 "${selectedObjectName}" 吗？此操作不可恢复。`,
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: () => onDelete(selectedObject)
      })
    }
  }

  const columns: ColumnsType<StorageObject> = [
    {
      title: '名称',
      dataIndex: 'key',
      key: 'key',
      width: 360,
      ellipsis: true,
      render: (key, object) => (
        <div className="object-name-cell">
          {getFileIcon(object)}
          <span className="object-name-text">{getObjectName(key, prefix)}</span>
        </div>
      )
    },
    {
      title: '类型',
      key: 'type',
      width: 96,
      render: (_, object) => getReadableType(object)
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 104,
      render: (size, object) => (object.isPrefix ? '-' : formatFileSize(size))
    },
    {
      title: '更新时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 188,
      render: (value) => value || '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 112,
      align: 'right',
      render: (_, object) => (
        <div className="object-row-actions">
          {!object.isPrefix && (
            <>
              <Tooltip title={canPreview(object) ? '预览' : '暂不支持预览'}>
                <Button
                  aria-label="预览"
                  disabled={!canPreview(object)}
                  icon={<EyeIcon />}
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    void previewObject(object)
                  }}
                />
              </Tooltip>
              <Tooltip title="下载">
                <Button
                  aria-label="下载"
                  icon={<DownloadSimpleIcon />}
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDownload(object)
                  }}
                />
              </Tooltip>
              <Tooltip title="分享链接">
                <Button
                  aria-label="分享链接"
                  icon={<LinkSimpleIcon />}
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    openShareDialog(object)
                  }}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="删除">
            <Button
              aria-label="删除"
              danger
              icon={<TrashSimpleIcon />}
              size="small"
              type="text"
              onClick={(event) => {
                event.stopPropagation()
                Modal.confirm({
                  centered: true,
                  title: '确认删除',
                  content: `确定要删除 "${getObjectName(object.key, prefix)}" 吗？此操作不可恢复。`,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: () => onDelete(object)
                })
              }}
            />
          </Tooltip>
        </div>
      )
    }
  ]

  const renderPreview = (compact = false): React.ReactNode => {
    if (previewLoading) return <Spin tip="正在加载预览..." />
    if (!selectedObject) return <Empty image={null} description="选择文件后预览" />
    if (selectedObject.isPrefix) return <Empty image={null} description="文件夹不支持预览" />
    if (!selectedCanPreview)
      return <Empty image={null} description="当前格式暂不支持预览，请下载后查看" />
    if (!activePreview) {
      return (
        <div className="quick-preview-empty">
          <FileMagnifyingGlassIcon weight="duotone" />
          <Typography.Text type="secondary">按 Space 或点击预览加载内容</Typography.Text>
          <Button type="primary" onClick={() => void previewObject(selectedObject)}>
            预览
          </Button>
        </div>
      )
    }

    if (activePreview.previewType === 'image' && activePreview.dataUrl) {
      return (
        <img
          className="object-preview-image"
          src={activePreview.dataUrl}
          alt={activePreview.fileName}
        />
      )
    }

    if (activePreview.previewType === 'pdf' && activePreview.dataUrl) {
      return (
        <iframe
          className="object-preview-frame"
          title={activePreview.fileName}
          src={activePreview.dataUrl}
        />
      )
    }

    if (activePreview.previewType === 'text') {
      return <pre className="object-preview-text">{activePreview.text}</pre>
    }

    if (activePreview.previewType === 'office' && activePreview.officeUrl) {
      return (
        <div className="office-preview-notice">
          <Typography.Text type="secondary">{activePreview.message}</Typography.Text>
          {compact ? null : (
            <iframe
              className="object-preview-frame"
              title={activePreview.fileName}
              src={activePreview.officeUrl}
            />
          )}
        </div>
      )
    }

    return <Empty image={null} description={activePreview.message ?? '当前格式暂不支持预览'} />
  }

  const renderInspector = (): React.ReactNode => {
    if (!selectedObject) {
      return (
        <div className="finder-inspector-empty">
          <InfoIcon weight="duotone" />
          <Typography.Text type="secondary">选择 Bucket、文件夹或文件查看详情</Typography.Text>
        </div>
      )
    }

    return (
      <>
        <div className="finder-inspector-hero">
          <div className="finder-inspector-icon">{getFileIcon(selectedObject)}</div>
          <Typography.Text strong className="finder-inspector-title">
            {selectedObjectName}
          </Typography.Text>
          <Typography.Text className="finder-inspector-subtitle">
            {getReadableType(selectedObject)}
          </Typography.Text>
        </div>

        <Segmented<InspectorMode>
          block
          className="finder-inspector-switch"
          value={inspectorMode}
          onChange={setInspectorMode}
          options={[
            { label: '信息', value: 'info' },
            { label: '预览', value: 'preview', disabled: selectedObject.isPrefix }
          ]}
        />

        {inspectorMode === 'info' ? (
          <div className="finder-inspector-section">
            <div className="detail-table" aria-label="对象属性">
              <div className="detail-item">
                <Typography.Text type="secondary" className="detail-label">
                  名称
                </Typography.Text>
                <Tooltip title={selectedObjectName}>
                  <Typography.Text className="detail-value" ellipsis>
                    {selectedObjectName}
                  </Typography.Text>
                </Tooltip>
              </div>
              <div className="detail-item">
                <Typography.Text type="secondary" className="detail-label">
                  类型
                </Typography.Text>
                <Typography.Text className="detail-value">{getReadableType(selectedObject)}</Typography.Text>
              </div>
              <div className="detail-item">
                <Typography.Text type="secondary" className="detail-label">
                  Bucket
                </Typography.Text>
                <Tooltip title={bucket}>
                  <Typography.Text className="detail-value" ellipsis>
                    {bucket || '-'}
                  </Typography.Text>
                </Tooltip>
              </div>
              <div className="detail-item">
                <Typography.Text type="secondary" className="detail-label">
                  前缀
                </Typography.Text>
                <Tooltip title={prefix || '/'}>
                  <Typography.Text className="detail-value" ellipsis>
                    {prefix || '/'}
                  </Typography.Text>
                </Tooltip>
              </div>
              <div className="detail-item">
                <Typography.Text type="secondary" className="detail-label">
                  完整路径
                </Typography.Text>
                <Tooltip title={selectedObject.key}>
                  <Typography.Text className="detail-value" ellipsis>
                    {selectedObject.key}
                  </Typography.Text>
                </Tooltip>
              </div>
              {!selectedObject.isPrefix && (
                <>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      扩展名
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {selectedExtension || '-'}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      大小
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {formatFileSize(selectedObject.size)}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      字节数
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {selectedObject.size.toLocaleString()}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      修改时间
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {selectedObject.lastModified || '-'}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      存储类型
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {selectedObject.storageClass || '-'}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      ETag
                    </Typography.Text>
                    <Tooltip title={selectedObject.etag}>
                      <Typography.Text className="detail-value" ellipsis>
                        {selectedObject.etag || '-'}
                      </Typography.Text>
                    </Tooltip>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      分享链接
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {activeSelectedShareLinks.length > 0
                        ? `${activeSelectedShareLinks.length} 个有效`
                        : '未分享'}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      查看次数
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {selectedShareLinks.reduce((total, item) => total + item.openCount, 0)}
                    </Typography.Text>
                  </div>
                  <div className="detail-item">
                    <Typography.Text type="secondary" className="detail-label">
                      最近打开
                    </Typography.Text>
                    <Typography.Text className="detail-value">
                      {formatDateTime(
                        selectedShareLinks
                          .map((item) => item.openedAt)
                          .filter((value): value is string => Boolean(value))
                          .sort()
                          .reduce((latest, value) => value || latest, undefined as string | undefined)
                      )}
                    </Typography.Text>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div
            className={`object-preview-body quick-preview-body${textPreviewTypes.has(activePreview?.previewType ?? '') ? ' text-preview-body' : ''}`}
          >
            {renderPreview(true)}
          </div>
        )}

        <div className="finder-inspector-actions">
          {!selectedObject.isPrefix && (
            <>
              {selectedCanPreview && (
                <Button
                  aria-label="预览"
                  icon={<EyeIcon />}
                  onClick={() => void previewObject(selectedObject)}
                >
                  预览
                </Button>
              )}
              <Button
                aria-label="下载"
                icon={<DownloadSimpleIcon />}
                onClick={() => onDownload(selectedObject)}
              >
                下载
              </Button>
              <Button
                aria-label="分享链接"
                icon={<LinkSimpleIcon />}
                onClick={() => openShareDialog(selectedObject)}
              >
                分享链接
              </Button>
            </>
          )}
          <Dropdown
            menu={{ items: selectedMoreMenuItems, onClick: handleSelectedMoreMenuClick }}
            trigger={['click']}
          >
            <Button aria-label="更多操作" icon={<DotsThreeIcon />}>
              更多
            </Button>
          </Dropdown>
        </div>
      </>
    )
  }

  const renderBucketPicker = (): React.ReactNode => (
    <div className="bucket-picker" aria-label="Bucket 选择">
      <div className="bucket-picker-header">
        <div>
          <Typography.Title level={4} className="bucket-picker-title">
            选择 Bucket
          </Typography.Title>
          <Typography.Text type="secondary" className="bucket-picker-description">
            选择一个 Bucket 后进入对象浏览，可通过面包屑返回此处。
          </Typography.Text>
        </div>
        <Space size={8}>
          <Tooltip title="刷新 Bucket">
            <Button
              aria-label="刷新 Bucket"
              icon={<ArrowClockwiseIcon />}
              onClick={onRefreshBuckets}
            />
          </Tooltip>
          <Button type="primary" onClick={onCreateBucket} disabled={!connectionId}>
            新建 Bucket
          </Button>
        </Space>
      </div>

      <Spin spinning={loadingBuckets}>
        {connectionId ? (
          buckets.length > 0 ? (
            <div className="bucket-picker-grid" role="listbox" aria-label="Bucket">
              {buckets.map((item) => (
                <button
                  key={item.name}
                  className="bucket-picker-item"
                  onClick={() => onOpenBucket(item)}
                  onContextMenu={(event) => {
                    event.preventDefault()
                    setBucketContextMenu({ bucket: item, x: event.clientX, y: event.clientY })
                  }}
                  type="button"
                  role="option"
                  aria-selected={false}
                >
                  <span className="bucket-picker-icon">
                    <DatabaseIcon weight="duotone" />
                  </span>
                  <span className="bucket-picker-content">
                    <span className="bucket-picker-name">{item.name}</span>
                    <span className="bucket-picker-meta">{item.region || '默认区域'}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="bucket-picker-empty">
              <Empty image={null} description="暂无 Bucket" />
            </div>
          )
        ) : (
          <div className="bucket-picker-empty">
            <Empty image={null} description="请选择或新建连接" />
          </div>
        )}
      </Spin>
    </div>
  )

  return (
    <section className="storage-finder-shell" aria-label="对象存储文件管理器">
      <div className="storage-breadcrumb-bar" aria-label="对象存储路径">
        <div className="storage-breadcrumb-main">
          {bucket ? (
            <Breadcrumb items={breadcrumbItems} />
          ) : (
            <Typography.Text className="storage-breadcrumb-placeholder">Bucket</Typography.Text>
          )}
          <Typography.Text className="storage-breadcrumb-meta">
            {activeBucket
              ? `${activeBucket.region || '默认区域'} · ${filteredRows.length} 项`
              : '选择 Bucket 后查看对象'}
          </Typography.Text>
        </div>
      </div>

      <div
        className={`storage-finder${bucket ? ' storage-finder-browsing' : ' storage-finder-picking'}${inspectorOpen ? ' inspector-open' : ''}`}
      >
      <main className="finder-main" aria-label="对象浏览">
        <div className="finder-toolbar">
          {bucket && (
            <div className="finder-toolbar-search">
              <Input
                allowClear
                aria-label="搜索当前目录"
                className="finder-search"
                placeholder="搜索当前目录"
                prefix={<MagnifyingGlassIcon />}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>
          )}
          <div className="finder-toolbar-actions">
            {bucket ? (
              <>
                <Segmented<ViewMode>
                  value={viewMode}
                  onChange={setViewMode}
                  options={[
                    { label: '列表', value: 'detail', icon: <ListBulletsIcon /> },
                    { label: '图标', value: 'icon', icon: <SquaresFourIcon /> }
                  ]}
                />
                <Tooltip title="刷新对象">
                  <Button
                    aria-label="刷新对象"
                    icon={<ArrowClockwiseIcon />}
                    onClick={onRefreshObjects}
                  />
                </Tooltip>
                <Tooltip title={inspectorOpen ? '关闭检查器' : '打开检查器'}>
                  <Button
                    aria-label={inspectorOpen ? '关闭检查器' : '打开检查器'}
                    icon={<InfoIcon />}
                    type={inspectorOpen ? 'primary' : 'default'}
                    onClick={() => setInspectorOpen((open) => !open)}
                  />
                </Tooltip>
              </>
            ) : (
              <Button
                aria-label="刷新 Bucket"
                icon={<ArrowClockwiseIcon />}
                onClick={onRefreshBuckets}
              />
            )}
          </div>
        </div>

        {bucket && (
          <div className="finder-commandbar" aria-label="对象操作">
            <Button
              aria-label="新建文件夹"
              icon={<FolderPlusIcon />}
              onClick={handleCreateFolder}
            >
              新建文件夹
            </Button>
            <Button
              aria-label="上传文件"
              icon={<UploadSimpleIcon />}
              type="primary"
              onClick={onUpload}
            >
              上传文件
            </Button>
            <Button
              aria-label="分享链接管理"
              icon={<LinkSimpleIcon />}
              onClick={() => setShareManagerOpen(true)}
            >
              分享管理
            </Button>
            <div className="finder-selection-actions">
              <Button
                aria-label="预览"
                icon={<EyeIcon />}
                disabled={!selectedObject || selectedObject.isPrefix || !selectedCanPreview}
                onClick={() => selectedObject && void previewObject(selectedObject)}
              >
                预览
              </Button>
              <Button
                aria-label="下载"
                icon={<DownloadSimpleIcon />}
                disabled={!selectedObject || selectedObject.isPrefix}
                onClick={() => selectedObject && onDownload(selectedObject)}
              >
                下载
              </Button>
              <Button
                aria-label="分享链接"
                icon={<LinkSimpleIcon />}
                disabled={!selectedObject || selectedObject.isPrefix}
                onClick={() => selectedObject && openShareDialog(selectedObject)}
              >
                分享链接
              </Button>
            </div>
          </div>
        )}

        <div
          className="finder-browser"
          tabIndex={0}
          onKeyDown={handleBrowserKeyDown}
          aria-label="文件列表，Enter 打开，Space 预览"
        >
          {bucket ? (
            viewMode === 'detail' ? (
              <Table
                className="finder-object-table"
                rowKey="key"
                columns={columns}
                dataSource={filteredRows}
                loading={loading}
                pagination={false}
                size="middle"
                tableLayout="fixed"
                scroll={{ x: 860, y: '100%' }}
                locale={{ emptyText: <Empty image={null} description="当前目录暂无对象" /> }}
                rowClassName={(object) =>
                  `object-table-row${selectedObject?.key === object.key ? ' object-table-row-selected' : ''}`
                }
                onRow={(object) => ({
                  tabIndex: 0,
                  role: 'button',
                  'aria-selected': selectedObject?.key === object.key,
                  onClick: () => onSelectObject(object),
                  onContextMenu: (event) => openContextMenu(event, object),
                  onDoubleClick: () => openSelected(object),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onSelectObject(object)
                      openSelected(object)
                    }
                  }
                })}
              />
            ) : (
              <Spin spinning={loading}>
                {filteredRows.length > 0 ? (
                  <div className="object-grid">
                    {filteredRows.map((object) => (
                      <button
                        key={object.key}
                        className={`object-grid-card${selectedObject?.key === object.key ? ' object-grid-card-selected' : ''}`}
                        onClick={() => onSelectObject(object)}
                        onContextMenu={(event) => openContextMenu(event, object)}
                        onDoubleClick={() => openSelected(object)}
                        type="button"
                        aria-pressed={selectedObject?.key === object.key}
                      >
                        <span className="object-grid-card-content">
                          {getFileIcon(object)}
                          <Typography.Text className="object-grid-name">
                            {getObjectName(object.key, prefix)}
                          </Typography.Text>
                          <Typography.Text type="secondary" className="object-grid-meta">
                            {object.isPrefix ? '文件夹' : formatFileSize(object.size)}
                          </Typography.Text>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty
                    image={null}
                    description={searchText ? '没有匹配结果' : '当前目录暂无对象'}
                  />
                )}
              </Spin>
            )
          ) : (
            renderBucketPicker()
          )}
        </div>
      </main>

      {bucket && inspectorOpen && (
        <aside className="finder-inspector" aria-label="检查器">
          <div className="finder-inspector-header">
            <Typography.Text strong>检查器</Typography.Text>
            <Button
              aria-label="关闭检查器"
              icon={<XIcon />}
              size="small"
              type="text"
              onClick={() => setInspectorOpen(false)}
            />
          </div>
          {renderInspector()}
        </aside>
      )}
      </div>

      <Modal
        open={previewOpen}
        title={
          preview?.fileName ??
          (selectedObject ? getObjectName(selectedObject.key, prefix) : '文件预览')
        }
        width="80vw"
        centered
        footer={
          preview ? (
            <Space>
              <Button
                aria-label="下载"
                icon={<DownloadSimpleIcon />}
                onClick={() => onDownload({ key: preview.key, size: preview.size })}
              >
                下载
              </Button>
              <Button
                aria-label="分享链接"
                icon={<LinkSimpleIcon />}
                onClick={() => openShareDialog({ key: preview.key, size: preview.size })}
              >
                分享链接
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
              <Typography.Text type="secondary">
                类型：{preview.contentType || preview.extension || '-'}
              </Typography.Text>
              <Typography.Text type="secondary">
                大小：{formatFileSize(preview.size)}
              </Typography.Text>
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
          if (copyMoveState.mode === 'copy')
            onCopy(copyMoveState.object, targetBucket, targetPrefix)
          else onMove(copyMoveState.object, targetBucket, targetPrefix)
          setCopyMoveState(undefined)
        }}
        onCancel={() => setCopyMoveState(undefined)}
      />

      <Modal
        open={Boolean(shareTarget)}
        title="创建分享链接"
        centered
        okText="创建并复制"
        cancelText="取消"
        confirmLoading={shareCreating}
        onOk={() => void createShareLink()}
        onCancel={() => setShareTarget(undefined)}
        destroyOnHidden
      >
        <div className="share-modal-body">
          <div className="share-target">
            <span className="share-target-icon">{shareTarget ? getFileIcon(shareTarget) : null}</span>
            <span className="share-target-content">
              <Typography.Text strong className="share-target-name">
                {shareTarget ? getObjectName(shareTarget.key, prefix) : '-'}
              </Typography.Text>
              <Typography.Text type="secondary" className="share-target-meta">
                {bucket || '-'} / {shareTarget?.key || '-'}
              </Typography.Text>
            </span>
          </div>
          <div>
            <Typography.Text type="secondary" className="share-field-label">
              有效期
            </Typography.Text>
            <Segmented<ShareExpiryPreset>
              block
              className="share-expiry-segmented"
              value={shareExpiryPreset}
              onChange={setShareExpiryPreset}
              options={shareExpiryOptions}
            />
          </div>
          {shareExpiryPreset === 'custom' && (
            <div>
              <Typography.Text type="secondary" className="share-field-label">
                自定义时长
              </Typography.Text>
              <div className="share-custom-control">
                <InputNumber
                  min={1}
                  max={168}
                  value={customShareHours}
                  className="share-custom-input"
                  onChange={(value) => setCustomShareHours(Number(value) || 1)}
                />
                <Typography.Text type="secondary" className="share-custom-unit">
                  小时
                </Typography.Text>
              </div>
            </div>
          )}
          <Typography.Text type="secondary" className="share-note">
            分享链接会直接访问对象存储，外部访问统计需要通过应用侧跳转服务或访问日志实现。这里记录从分享管理中打开的次数和最近打开时间。
          </Typography.Text>
        </div>
      </Modal>

      <Modal
        open={shareManagerOpen}
        title="分享链接管理"
        centered
        width={860}
        footer={<Button onClick={() => setShareManagerOpen(false)}>关闭</Button>}
        onCancel={() => setShareManagerOpen(false)}
      >
        <Table<ShareLinkRecord>
          className="share-manager-table"
          rowKey="id"
          columns={[
            {
              title: '对象',
              dataIndex: 'objectName',
              key: 'objectName',
              width: 220,
              ellipsis: true,
              render: (_, record) => (
                <div className="share-object-cell">
                  <Typography.Text className="share-object-name" ellipsis>
                    {record.objectName}
                  </Typography.Text>
                  <Typography.Text type="secondary" className="share-object-key" ellipsis>
                    {record.key}
                  </Typography.Text>
                </div>
              )
            },
            {
              title: '状态',
              key: 'status',
              width: 98,
              render: (_, record) =>
                isShareExpired(record) ? <Tag>已过期</Tag> : <Tag color="success">有效</Tag>
            },
            {
              title: '有效期',
              dataIndex: 'expiresInSeconds',
              key: 'expiresInSeconds',
              width: 90,
              render: (value) => formatDuration(value)
            },
            {
              title: '过期时间',
              dataIndex: 'expiresAt',
              key: 'expiresAt',
              width: 160,
              render: (value) => formatDateTime(value)
            },
            {
              title: '查看',
              dataIndex: 'openCount',
              key: 'openCount',
              width: 72,
              align: 'right',
              render: (value) => value
            },
            {
              title: '最近打开',
              dataIndex: 'openedAt',
              key: 'openedAt',
              width: 150,
              render: (value) => formatDateTime(value)
            },
            {
              title: '操作',
              key: 'actions',
              width: 152,
              align: 'right',
              render: (_, record) => (
                <Space size={4}>
                  <Tooltip title="复制分享链接">
                    <Button
                      aria-label="复制分享链接"
                      icon={<CopySimpleIcon />}
                      size="small"
                      type="text"
                      onClick={() => void copyShareUrl(record)}
                    />
                  </Tooltip>
                  <Tooltip title="打开并计数">
                    <Button
                      aria-label="打开分享链接"
                      disabled={isShareExpired(record)}
                      icon={<EyeIcon />}
                      size="small"
                      type="text"
                      onClick={() => void openTrackedShareUrl(record)}
                    />
                  </Tooltip>
                  <Tooltip title="移除记录">
                    <Button
                      aria-label="移除分享记录"
                      danger
                      icon={<LinkBreakIcon />}
                      size="small"
                      type="text"
                      onClick={() => void removeShareLink(record)}
                    />
                  </Tooltip>
                </Space>
              )
            }
          ]}
          dataSource={currentShareLinks}
          pagination={false}
          size="small"
          scroll={{ x: 820, y: 360 }}
          locale={{ emptyText: <Empty image={null} description="暂无分享链接" /> }}
        />
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
      <Dropdown
        open={Boolean(bucketContextMenu)}
        menu={{ items: bucketContextMenuItems, onClick: handleBucketContextMenuClick }}
        trigger={['contextMenu']}
        onOpenChange={(open) => {
          if (!open) closeBucketContextMenu()
        }}
      >
        <div
          className="object-context-anchor"
          style={{ left: bucketContextMenu?.x ?? 0, top: bucketContextMenu?.y ?? 0 }}
        />
      </Dropdown>
    </section>
  )
}

interface CopyMoveModalProps {
  state: CopyMoveState | undefined
  buckets: BucketInfo[]
  currentBucket: string
  onConfirm: (targetBucket: string, targetPrefix: string) => void
  onCancel: () => void
}

function CopyMoveModal({
  state,
  buckets,
  currentBucket,
  onConfirm,
  onCancel
}: CopyMoveModalProps): React.JSX.Element {
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
          <div>
            <Typography.Text strong>{fileName}</Typography.Text>
          </div>
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
