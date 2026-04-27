import { CheckCircleOutlined, CloudServerOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Card, Empty, List, Space, Tag, Tooltip, Typography } from 'antd'
import type { ConnectionSummary } from '../../../../shared/types/connection'

interface ConnectionListProps {
  connections: ConnectionSummary[]
  activeConnectionId?: string
  loading: boolean
  onRefresh: () => void
  onCreate: () => void
  onTest: (connection: ConnectionSummary) => void
  onDelete: (connection: ConnectionSummary) => void
  onSelect: (connection: ConnectionSummary) => void
}

const providerLabel: Record<ConnectionSummary['providerType'], string> = {
  minio: 'MinIO',
  's3-compatible': 'S3 Compatible',
  'aliyun-oss': '阿里云 OSS',
  'tencent-cos': '腾讯云 COS'
}

export function ConnectionList({
  connections,
  activeConnectionId,
  loading,
  onRefresh,
  onCreate,
  onTest,
  onDelete,
  onSelect
}: ConnectionListProps): React.JSX.Element {
  return (
    <Card
      title="连接"
      size="small"
      extra={
        <Space>
          <Tooltip title="刷新连接">
            <Button aria-label="刷新连接" icon={<ReloadOutlined />} size="small" onClick={onRefresh} />
          </Tooltip>
          <Button icon={<PlusOutlined />} size="small" type="primary" onClick={onCreate}>
            新建
          </Button>
        </Space>
      }
      className="panel-card connection-card"
    >
      <div className="connection-card-summary">
        <Typography.Text type="secondary">已保存连接</Typography.Text>
        <Typography.Text strong>{connections.length}</Typography.Text>
      </div>
      <List
        className="connection-list"
        loading={loading}
        dataSource={connections}
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无连接" /> }}
        renderItem={(connection) => (
          <List.Item
            className={connection.id === activeConnectionId ? 'connection-item active' : 'connection-item'}
            onClick={() => onSelect(connection)}
          >
            <div className="connection-item-inner">
              <div className="connection-icon-wrap">
                <CloudServerOutlined className="connection-icon" />
              </div>
              <div className="connection-meta">
                <Space size={6} className="connection-title-row">
                  <Typography.Text strong ellipsis className="connection-name">
                    {connection.name}
                  </Typography.Text>
                  <Tag bordered={false} className="connection-provider-tag">
                    {providerLabel[connection.providerType]}
                  </Tag>
                </Space>
                <Tooltip title={connection.endpoint} placement="right">
                  <Typography.Text type="secondary" ellipsis className="connection-endpoint">
                    {connection.endpoint}
                  </Typography.Text>
                </Tooltip>
                <div className="connection-actions">
                  <Button
                    icon={<CheckCircleOutlined />}
                    size="small"
                    type="text"
                    onClick={(event) => {
                      event.stopPropagation()
                      onTest(connection)
                    }}
                  >
                    测试
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    type="text"
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete(connection)
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          </List.Item>
        )}
      />
    </Card>
  )
}
