import {
  CloudOutlined,
  DashboardOutlined,
  SettingOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Titlebar } from './Titlebar'

const { Sider, Content } = Layout

export type AppPage = 'overview' | 'storage' | 'transfers' | 'settings'

interface MainLayoutProps {
  activePage: AppPage
  sidebar: ReactNode
  children: ReactNode
  onPageChange: (page: AppPage) => void
}

export function MainLayout({
  activePage,
  sidebar,
  children,
  onPageChange
}: MainLayoutProps): React.JSX.Element {
  return (
    <Layout className="app-shell">
      <Titlebar />
      <Layout>
        <Sider width={320} theme="light" className="app-sidebar">
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
        </Sider>
        <Content className="app-content">{children}</Content>
      </Layout>
    </Layout>
  )
}
