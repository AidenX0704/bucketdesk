import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  extra?: ReactNode
}

export function PageHeader({ title, description, extra }: PageHeaderProps): React.JSX.Element {
  return (
    <div className="page-header">
      <div>
        <Typography.Title level={3} className="page-title" style={{ marginBottom: 6 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {description}
        </Typography.Text>
      </div>
      {extra && <Space>{extra}</Space>}
    </div>
  )
}
