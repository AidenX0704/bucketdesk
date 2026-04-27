import { DeleteOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Button, Card, Dropdown, Empty, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { MenuProps } from 'antd'
import { useState } from 'react'
import type { BucketInfo } from '../../../../shared/types/bucket'

interface ContextMenuState {
  bucket: BucketInfo
  x: number
  y: number
}

interface BucketTableProps {
  buckets: BucketInfo[]
  loading: boolean
  hasConnection: boolean
  onCreate: () => void
  onDelete: (bucket: BucketInfo) => void
  onOpen: (bucket: BucketInfo) => void
}

export function BucketTable({
  buckets,
  loading,
  hasConnection,
  onCreate,
  onDelete,
  onOpen
}: BucketTableProps): React.JSX.Element {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>()

  const openContextMenu = (event: React.MouseEvent, bucket: BucketInfo): void => {
    event.preventDefault()
    setContextMenu({ bucket, x: event.clientX, y: event.clientY })
  }

  const closeContextMenu = (): void => setContextMenu(undefined)

  const contextMenuItems: MenuProps['items'] = [
    {
      key: 'open',
      icon: <FolderOpenOutlined />,
      label: '打开'
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

    const { bucket } = contextMenu
    closeContextMenu()

    if (key === 'open') onOpen(bucket)
    if (key === 'delete') onDelete(bucket)
  }

  const columns: ColumnsType<BucketInfo> = [
    {
      title: 'Bucket 名称',
      dataIndex: 'name',
      key: 'name',
      render: (name) => <Typography.Text strong>{name}</Typography.Text>
    },
    {
      title: '区域',
      dataIndex: 'region',
      key: 'region',
      render: (region) => region || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) => createdAt || '-'
    }
  ]

  return (
    <Card title="Bucket 浏览" extra={<Button type="primary" onClick={onCreate}>创建 Bucket</Button>}>
      {hasConnection ? (
        <Table
          rowKey="name"
          columns={columns}
          dataSource={buckets}
          loading={loading}
          pagination={false}
          rowClassName="object-table-row"
          onRow={(bucket) => ({
            onContextMenu: (event) => openContextMenu(event, bucket),
            onDoubleClick: () => onOpen(bucket)
          })}
        />
      ) : (
        <Empty description="请选择或新建连接后查看 Bucket" />
      )}
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
