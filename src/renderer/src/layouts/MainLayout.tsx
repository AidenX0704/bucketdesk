import {
  CloudOutlined,
  DashboardOutlined,
  SettingOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Titlebar } from './Titlebar'

const { Sider, Content } = Layout

export type AppPage = 'overview' | 'storage' | 'transfers' | 'settings'

interface MainLayoutProps {
  activePage: AppPage
  sidebar: ReactNode
  children: ReactNode
  onPageChange: (page: AppPage) => void
}

const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 480

export function MainLayout({
  activePage,
  sidebar,
  children,
  onPageChange
}: MainLayoutProps): React.JSX.Element {
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)
  const resizerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (event: MouseEvent): void => {
      const newWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, event.clientX))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = (): void => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  return (
    <Layout className="app-shell">
      <Titlebar />
      <Layout>
        <Sider width={sidebarWidth} theme="light" className="app-sidebar">
          <div className="nav-section">
            <Typography.Text className="nav-kicker">Workspace</Typography.Text>
            <Menu
              mode="inline"
              selectedKeys={[activePage]}
              onClick={({ key }) => onPageChange(key as AppPage)}
              items={[
                { key: 'overview', icon: <DashboardOutlined />, label: '总览' },
                { key: 'storage', icon: <CloudOutlined />, label: '对象存储' },
                { key: 'transfers', icon: <SwapOutlined />, label: '传输中心' },
                { key: 'settings', icon: <SettingOutlined />, label: '设置' }
              ]}
            />
          </div>
          <div className="connection-panel">{sidebar}</div>
          <div
            ref={resizerRef}
            className={`sidebar-resizer${isResizing ? ' active' : ''}`}
            onMouseDown={handleMouseDown}
          />
        </Sider>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}
