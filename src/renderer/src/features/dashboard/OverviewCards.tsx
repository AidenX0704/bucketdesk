import {
  CloudUploadOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  RightOutlined,
  SwapOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { Card, Col, Empty, Row, Tag, Typography } from 'antd'
import type { ConnectionSummary } from '../../../../shared/types/connection'
import type { TransferTask } from '../../../../shared/types/transfer'
import type { AppPage } from '../../layouts/MainLayout'

interface OverviewCardsProps {
  connectionCount: number
  bucketCount: number
  transferCount: number
  recentTransfers: TransferTask[]
  connections: ConnectionSummary[]
  onNavigate: (page: AppPage) => void
  onCreateConnection: () => void
}

const statusLabel: Record<TransferTask['status'], string> = {
  queued: '排队中',
  running: '传输中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消'
}

const statusColor: Record<TransferTask['status'], string> = {
  queued: 'default',
  running: 'processing',
  paused: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default'
}

export function OverviewCards({
  connectionCount,
  bucketCount,
  transferCount,
  recentTransfers,
  connections,
  onNavigate,
  onCreateConnection
}: OverviewCardsProps): React.JSX.Element {
  return (
    <div className="overview-shell">
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card
            className="metric-card metric-card-blue"
            variant="borderless"
            hoverable
            onClick={() => onNavigate('storage')}
          >
            <div className="metric-content">
              <Typography.Text className="metric-title">活跃连接</Typography.Text>
              <div className="metric-value-row">
                <DatabaseOutlined className="metric-icon metric-icon-blue" />
                <Typography.Text className="metric-value">{connectionCount}</Typography.Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="metric-card metric-card-cyan"
            variant="borderless"
            hoverable
            onClick={() => onNavigate('storage')}
          >
            <div className="metric-content">
              <Typography.Text className="metric-title">存储桶</Typography.Text>
              <div className="metric-value-row">
                <FolderOpenOutlined className="metric-icon metric-icon-cyan" />
                <Typography.Text className="metric-value">{bucketCount}</Typography.Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            className="metric-card metric-card-green"
            variant="borderless"
            hoverable
            onClick={() => onNavigate('transfers')}
          >
            <div className="metric-content">
              <Typography.Text className="metric-title">传输任务</Typography.Text>
              <div className="metric-value-row">
                <CloudUploadOutlined className="metric-icon metric-icon-green" />
                <Typography.Text className="metric-value">{transferCount}</Typography.Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 24]} align="stretch">
        <Col xs={24} lg={16}>
          <Card
            title={
              <span className="card-title-row">
                <SwapOutlined className="section-title-icon" />
                <span>最近传输</span>
              </span>
            }
            className="surface-card recent-transfer-card"
            extra={
              <Typography.Link onClick={() => onNavigate('transfers')}>
                查看全部 <RightOutlined style={{ fontSize: 10 }} />
              </Typography.Link>
            }
            styles={{ body: { padding: recentTransfers.length > 0 ? '0' : undefined } }}
          >
            {recentTransfers.length > 0 ? (
              <div className="recent-transfer-list">
                {recentTransfers.map((task) => (
                  <div className="recent-transfer-item" key={task.id}>
                    <div className="recent-transfer-file">
                      <Tag
                        color={task.direction === 'upload' ? 'blue' : 'green'}
                        className="transfer-direction-tag"
                      >
                        {task.direction === 'upload' ? '上传' : '下载'}
                      </Tag>
                      <Typography.Text ellipsis className="recent-transfer-name">
                        {task.objectKey.split('/').pop() ?? task.objectKey}
                      </Typography.Text>
                    </div>
                    <Tag color={statusColor[task.status]} className="transfer-status-tag">
                      <span className="transfer-status-dot" />
                      {statusLabel[task.status]}
                    </Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无传输记录" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span className="card-title-row">
                <ThunderboltOutlined className="quick-title-icon" />
                <span>快速操作</span>
              </span>
            }
            className="surface-card quick-panel"
          >
            <div className="quick-action-list">
              <button className="quick-action-card quick-action-blue" onClick={onCreateConnection}>
                <span className="quick-action-icon">
                  <PlusOutlined />
                </span>
                <span className="quick-action-copy">
                  <Typography.Text strong>新建连接</Typography.Text>
                  <Typography.Text type="secondary">添加 MinIO、S3 或其他云存储</Typography.Text>
                </span>
              </button>

              <button
                className="quick-action-card quick-action-cyan"
                onClick={() => onNavigate('storage')}
              >
                <span className="quick-action-icon">
                  <FolderOpenOutlined />
                </span>
                <span className="quick-action-copy">
                  <Typography.Text strong>浏览文件</Typography.Text>
                  <Typography.Text type="secondary">
                    {connectionCount > 0 ? `当前有 ${connectionCount} 个连接` : '请先创建连接'}
                  </Typography.Text>
                </span>
              </button>

              <button
                className="quick-action-card quick-action-green"
                onClick={() => onNavigate('transfers')}
              >
                <span className="quick-action-icon">
                  <CloudUploadOutlined />
                </span>
                <span className="quick-action-copy">
                  <Typography.Text strong>传输管理</Typography.Text>
                  <Typography.Text type="secondary">
                    {transferCount > 0 ? `当前有 ${transferCount} 个任务` : '暂无传输任务'}
                  </Typography.Text>
                </span>
              </button>
            </div>

            {connections.length > 0 && (
              <div className="quick-access-panel">
                <Typography.Text type="secondary">已保存的快速访问:</Typography.Text>
                <div className="quick-access-tags">
                  {connections.map((conn) => (
                    <Tag key={conn.id} className="quick-access-tag">
                      {conn.name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
