import { BorderOutlined, CloseOutlined, MinusOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'
import { useEffect, useState } from 'react'

export function Titlebar(): React.JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    void window.api.window.isMaximized().then((result) => {
      if (result.ok) setIsMaximized(result.data)
    })

    return window.api.window.onMaximizeChanged(setIsMaximized)
  }, [])

  const toggleMaximize = async (): Promise<void> => {
    const result = await window.api.window.toggleMaximize()
    if (result.ok) setIsMaximized(result.data)
  }

  return (
    <div className="titlebar">
      <div className="titlebar-brand">
        <div className="titlebar-logo">M</div>
        <div>
          <Typography.Text strong>MinIO Cloud Manager</Typography.Text>
          <Typography.Text type="secondary" className="titlebar-subtitle">
            多云对象存储管理客户端
          </Typography.Text>
        </div>
      </div>
      <div className="titlebar-drag" />
      <Space size={0} className="titlebar-actions">
        <Button aria-label="最小化" type="text" icon={<MinusOutlined />} onClick={() => void window.api.window.minimize()} />
        <Button
          aria-label={isMaximized ? '还原窗口' : '最大化窗口'}
          type="text"
          icon={<BorderOutlined />}
          title={isMaximized ? '还原' : '最大化'}
          onClick={() => void toggleMaximize()}
        />
        <Button aria-label="关闭" danger type="text" icon={<CloseOutlined />} onClick={() => void window.api.window.close()} />
      </Space>
    </div>
  )
}
