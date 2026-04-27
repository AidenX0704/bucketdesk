import { CloudUploadOutlined, DatabaseOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { Card, Col, Row, Statistic } from 'antd'

interface OverviewCardsProps {
  connectionCount: number
  bucketCount: number
  transferCount: number
}

export function OverviewCards({
  connectionCount,
  bucketCount,
  transferCount
}: OverviewCardsProps): React.JSX.Element {
  return (
    <Row gutter={16}>
      <Col span={8}>
        <Card className="metric-card metric-card-blue">
          <Statistic title="连接数" value={connectionCount} prefix={<DatabaseOutlined />} />
        </Card>
      </Col>
      <Col span={8}>
        <Card className="metric-card metric-card-cyan">
          <Statistic title="Bucket" value={bucketCount} prefix={<FolderOpenOutlined />} />
        </Card>
      </Col>
      <Col span={8}>
        <Card className="metric-card metric-card-green">
          <Statistic title="传输任务" value={transferCount} prefix={<CloudUploadOutlined />} />
        </Card>
      </Col>
    </Row>
  )
}
