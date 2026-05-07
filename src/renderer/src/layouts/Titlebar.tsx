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
        <div className="titlebar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M22 7L12 12L2 7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 2L7 4.5L17 9.5L22 7L12 2Z" fill="currentColor" opacity="0.2"/>
            <path d="M2 7L7 9.5L17 4.5L12 2L2 7Z" fill="currentColor" opacity="0.15"/>
            <path d="M12 12L7 9.5V14.5L12 17V12Z" fill="currentColor" opacity="0.1"/>
          </svg>
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <Typography.Text strong style={{ fontSize: 14 }}>MinIO Cloud Manager</Typography.Text>
          <Typography.Text type="secondary" className="titlebar-subtitle">
            多云对象存储管理
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
