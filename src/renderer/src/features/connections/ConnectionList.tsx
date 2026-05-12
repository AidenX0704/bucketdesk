import {
  CheckCircleOutlined,
  CloudOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Button, Dropdown, Empty, List, Tag, Tooltip, Typography, MenuProps } from 'antd'
import type { ConnectionSummary } from '../../../../shared/types/connection'

interface ConnectionListProps {
  connections: ConnectionSummary[]
  activeConnectionId?: string
  loading: boolean
  onRefresh: () => void
  onCreate: () => void
  onEdit: (connection: ConnectionSummary) => void
  onTest: (connection: ConnectionSummary) => void
  onDelete: (connection: ConnectionSummary) => void
  onSelect: (connection: ConnectionSummary) => void
}

const providerLabel: Record<ConnectionSummary['providerType'], string> = {
  minio: 'MinIO',
  's3-compatible': 'S3',
  'aliyun-oss': 'OSS',
  'tencent-cos': 'COS'
}

export function ConnectionList({
  connections,
  activeConnectionId,
  loading,
  onRefresh,
  onCreate,
  onEdit,
  onTest,
  onDelete,
  onSelect
}: ConnectionListProps): React.JSX.Element {
  // 空状态 UI
  const emptyState = (
    <div className="connection-empty-state">
      <div className="connection-empty-icon">
        <CloudOutlined />
      </div>
      <Typography.Text className="connection-empty-text">暂无连接</Typography.Text>
      <Typography.Text className="connection-empty-hint">
        点击「新建」添加你的第一个存储连接
      </Typography.Text>
    </div>
  )

  // 生成右侧操作菜单
  const getActionMenu = (connection: ConnectionSummary): MenuProps => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑连接',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          onEdit(connection)
        }
      },
      {
        key: 'test',
        icon: <CheckCircleOutlined />,
        label: '测试连通性',
        onClick: (e) => {
          e.domEvent.stopPropagation()
          onTest(connection)
        }
      },
      { type: 'divider' },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: (e) => {
          e.domEvent.stopPropagation()
          onDelete(connection)
        }
      }
    ]
  })

  return (
    <div className="connection-card">
      {/* Header */}
      <div className="connection-card-header">
        <Typography.Text className="connection-card-title">
          连接 <span className="connection-card-count">{loading ? '-' : connections.length}</span>
        </Typography.Text>
        <div className="connection-card-actions">
          <Tooltip title="刷新连接">
            <button
              aria-label="刷新连接"
              className={`connection-header-icon-button${loading ? ' spinning' : ''}`}
              onClick={onRefresh}
              type="button"
            >
              <ReloadOutlined />
            </button>
          </Tooltip>
          <Button
            className="connection-header-create-button"
            onClick={onCreate}
            type="primary"
            size="small"
          >
            <PlusOutlined />
            新建
          </Button>
        </div>
      </div>

      {/* 列表内容 */}
      {loading ? (
        <div className="connection-skeleton-list" aria-label="连接加载中">
          <div className="connection-skeleton-item" />
          <div className="connection-skeleton-item" />
          <div className="connection-skeleton-item" />
        </div>
      ) : (
        <List
          className="connection-list"
          dataSource={connections}
          split={false}
          locale={{
            emptyText: <Empty image={null} description={emptyState} />
          }}
          renderItem={(connection) => (
            <List.Item
              className={
                connection.id === activeConnectionId ? 'connection-item active' : 'connection-item'
              }
              onClick={() => onSelect(connection)}
            >
              <div className="connection-item-content">
                {/* 左侧：Icon */}
                <div className="connection-icon-wrap">
                  <CloudServerOutlined className="connection-icon" />
                </div>

                {/* 中间：核心信息 */}
                <div className="connection-main-info">
                  <div className="connection-name-row">
                    <Typography.Text strong ellipsis className="connection-name">
                      {connection.name}
                    </Typography.Text>
                    <Tag bordered={false} className="connection-provider-tag">
                      {providerLabel[connection.providerType]}
                    </Tag>
                  </div>
                  <Tooltip title={connection.endpoint} placement="bottomLeft">
                    <Typography.Text type="secondary" ellipsis className="connection-endpoint">
                      {connection.endpoint}
                    </Typography.Text>
                  </Tooltip>
                </div>

                {/* 右侧：操作按钮 */}
                <div className="connection-item-actions">
                  <Dropdown
                    menu={getActionMenu(connection)}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <button
                      className="connection-more-button"
                      onClick={(e) => e.stopPropagation()}
                      type="button"
                    >
                      <MoreOutlined />
                    </button>
                  </Dropdown>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  )
}
