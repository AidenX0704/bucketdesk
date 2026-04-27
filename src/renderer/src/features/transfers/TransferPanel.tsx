import { Button, Card, Empty, Progress, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TransferTask } from '../../../../shared/types/transfer'

interface TransferPanelProps {
  tasks: TransferTask[]
  onPause: (task: TransferTask) => void
  onResume: (task: TransferTask) => void
  onCancel: (task: TransferTask) => void
  onRetry: (task: TransferTask) => void
  onOpenFile: (task: TransferTask) => void
  onDeleteFile: (task: TransferTask) => void
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

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  const precision = exponent === 0 || value >= 100 ? 0 : 1

  return `${value.toFixed(precision)} ${units[exponent]}`
}

const getProgressPercent = (task: TransferTask): number => {
  if (task.status === 'completed') return 100
  if (task.totalBytes <= 0) return 0
  return Math.min((task.transferredBytes / task.totalBytes) * 100, 100)
}

const getProgressStatus = (task: TransferTask): 'normal' | 'active' | 'exception' | 'success' => {
  if (task.status === 'failed' || task.status === 'cancelled') return 'exception'
  if (task.status === 'completed') return 'success'
  if (task.status === 'running') return 'active'
  return 'normal'
}

export function TransferPanel({
  tasks,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onOpenFile,
  onDeleteFile
}: TransferPanelProps): React.JSX.Element {
  const columns: ColumnsType<TransferTask> = [
    {
      title: '方向',
      dataIndex: 'direction',
      key: 'direction',
      width: 76,
      render: (direction) => (
        <Tag color={direction === 'upload' ? 'blue' : 'green'}>{direction === 'upload' ? '上传' : '下载'}</Tag>
      )
    },
    {
      title: '对象',
      dataIndex: 'objectKey',
      key: 'objectKey',
      width: 330,
      render: (value, task) => (
        <Space direction="vertical" size={2} className="transfer-object-cell">
          <Tooltip title={value}>
            <Typography.Text strong ellipsis className="transfer-object-name">
              {value}
            </Typography.Text>
          </Tooltip>
          <Tooltip title={`${task.bucket} → ${task.localPath}`}>
            <Typography.Text type="secondary" ellipsis className="transfer-object-path">
              {task.bucket} → {task.localPath}
            </Typography.Text>
          </Tooltip>
          {task.errorMessage && (
            <Tooltip title={task.errorMessage}>
              <Typography.Text type="danger" ellipsis className="transfer-object-error">
                {task.errorMessage}
              </Typography.Text>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 96,
      render: (status, task) => (
        <Space direction="vertical" size={4} className="transfer-status-cell">
          <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>
          {task.resumable && task.direction === 'download' && (
            <Typography.Text type="secondary" className="transfer-resumable-label">
              断点
            </Typography.Text>
          )}
        </Space>
      )
    },
    {
      title: '进度',
      key: 'progress',
      width: 230,
      render: (_, task) => {
        const percent = Number(getProgressPercent(task).toFixed(1))

        return (
          <Space direction="vertical" size={4} className="transfer-progress-cell">
            <Progress percent={percent} size="small" status={getProgressStatus(task)} />
            <Typography.Text type="secondary" className="transfer-progress-meta">
              {formatFileSize(task.transferredBytes)} / {formatFileSize(task.totalBytes)}
            </Typography.Text>
          </Space>
        )
      }
    },
    {
      title: '速度',
      dataIndex: 'speedBytesPerSecond',
      key: 'speedBytesPerSecond',
      width: 106,
      render: (speed, task) => (task.status === 'running' ? `${formatFileSize(speed)}/s` : '-')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, task) => (
        <Space className="transfer-actions">
          {task.status === 'running' && (
            <Button size="small" onClick={() => onPause(task)}>
              暂停
            </Button>
          )}
          {task.status === 'paused' && (
            <Button size="small" type="primary" onClick={() => onResume(task)}>
              继续
            </Button>
          )}
          {task.status === 'failed' && (
            <Button size="small" onClick={() => onRetry(task)}>
              重试
            </Button>
          )}
          {task.direction === 'download' && task.status === 'completed' && (
            <>
              <Button size="small" onClick={() => onOpenFile(task)}>
                打开
              </Button>
              <Button danger size="small" type="text" onClick={() => onDeleteFile(task)}>
                删除
              </Button>
            </>
          )}
          {(task.status === 'running' || task.status === 'queued' || task.status === 'paused') && (
            <Button danger size="small" type="text" onClick={() => onCancel(task)}>
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Card title="传输任务" className="surface-card">
      {tasks.length > 0 ? (
        <Table
          rowKey="id"
          className="transfer-table"
          columns={columns}
          dataSource={tasks}
          pagination={false}
          size="middle"
          tableLayout="fixed"
          scroll={{ x: 990 }}
        />
      ) : (
        <Empty description="暂无传输任务，上传或下载对象后会显示在这里。" />
      )}
    </Card>
  )
}
