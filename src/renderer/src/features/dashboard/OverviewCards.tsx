import { CloudUploadOutlined, DatabaseOutlined, FolderOpenOutlined, PlusOutlined, RightOutlined, SwapOutlined } from '@ant-design/icons'
import { Card, Col, Empty, List, Row, Space, Statistic, Tag, Typography } from 'antd'
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
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="metric-card metric-card-blue" bordered={false} hoverable onClick={() => onNavigate('storage')}>
            <Statistic
              title="活跃连接"
              value={connectionCount}
              prefix={<DatabaseOutlined style={{ color: 'var(--brand-primary)', fontSize: 20 }} />}
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="metric-card metric-card-cyan" bordered={false} hoverable onClick={() => onNavigate('storage')}>
            <Statistic
              title="存储桶"
              value={bucketCount}
              prefix={<FolderOpenOutlined style={{ color: 'var(--color-info)', fontSize: 20 }} />}
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="metric-card metric-card-green" bordered={false} hoverable onClick={() => onNavigate('transfers')}>
            <Statistic
              title="传输任务"
              value={transferCount}
              prefix={<CloudUploadOutlined style={{ color: 'var(--color-success)', fontSize: 20 }} />}
              valueStyle={{ fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <SwapOutlined />
                <span>最近传输</span>
              </Space>
            }
            className="surface-card"
            extra={
              <Typography.Link onClick={() => onNavigate('transfers')}>
                查看全部 <RightOutlined style={{ fontSize: 10 }} />
              </Typography.Link>
            }
            styles={{ body: { padding: recentTransfers.length > 0 ? '0' : undefined } }}
          >
            {recentTransfers.length > 0 ? (
              <List
                dataSource={recentTransfers}
                size="small"
                renderItem={(task) => (
                  <List.Item style={{ padding: '10px 24px' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Tag color={task.direction === 'upload' ? 'blue' : 'green'} style={{ margin: 0 }}>
                          {task.direction === 'upload' ? '上传' : '下载'}
                        </Tag>
                        <Typography.Text ellipsis style={{ maxWidth: 240 }}>
                          {task.objectKey.split('/').pop() ?? task.objectKey}
                        </Typography.Text>
                      </Space>
                      <Tag color={statusColor[task.status]}>{statusLabel[task.status]}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无传输记录" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined />
                <span>快速操作</span>
              </Space>
            }
            className="surface-card"
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Card
                hoverable
                className="quick-action-card"
                onClick={onCreateConnection}
                styles={{ body: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}
              >
                <PlusOutlined style={{ fontSize: 18, color: 'var(--brand-primary)' }} />
                <div>
                  <Typography.Text strong>新建连接</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    添加 MinIO、S3 或其他云存储
                  </Typography.Text>
                </div>
              </Card>
              <Card
                hoverable
                className="quick-action-card"
                onClick={() => onNavigate('storage')}
                styles={{ body: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}
              >
                <FolderOpenOutlined style={{ fontSize: 18, color: 'var(--color-info)' }} />
                <div>
                  <Typography.Text strong>浏览文件</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    {connectionCount > 0 ? `当前有 ${connectionCount} 个连接` : '请先创建连接'}
                  </Typography.Text>
                </div>
              </Card>
              <Card
                hoverable
                className="quick-action-card"
                onClick={() => onNavigate('transfers')}
                styles={{ body: { padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 } }}
              >
                <CloudUploadOutlined style={{ fontSize: 18, color: 'var(--color-success)' }} />
                <div>
                  <Typography.Text strong>传输管理</Typography.Text>
                  <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                    {transferCount > 0 ? `当前有 ${transferCount} 个任务` : '暂无传输任务'}
                  </Typography.Text>
                </div>
              </Card>
              {connections.length > 0 && (
                <Card className="connection-overview-card" styles={{ body: { padding: '12px 16px' } }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    已保存连接
                  </Typography.Text>
                  <Space wrap size={[8, 4]}>
                    {connections.map((conn) => (
                      <Tag key={conn.id} bordered={false} className="connection-provider-tag">
                        {conn.name}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
