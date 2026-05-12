import {
  CodeSandboxOutlined,
  CloudOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  SettingOutlined,
  SwapOutlined
} from '@ant-design/icons'
import { Layout, Menu, Typography } from 'antd'
import { type ReactNode } from 'react'
import { Titlebar } from './Titlebar'

const { Sider, Content } = Layout

export type AppPage = 'overview' | 'storage' | 'transfers' | 'settings' | 'developerDebug'

interface MainLayoutProps {
  activePage: AppPage
  sidebar: ReactNode
  children: ReactNode
  onPageChange: (page: AppPage) => void
  showDeveloperDebug?: boolean
}

const SIDEBAR_WIDTH = 256

export function MainLayout({
  activePage,
  sidebar,
  children,
  onPageChange,
  showDeveloperDebug = false
}: MainLayoutProps): React.JSX.Element {
  return (
    <Layout className="app-shell">
      <Titlebar />
      <Layout>
        <Sider width={SIDEBAR_WIDTH} theme="light" className="app-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <CodeSandboxOutlined />
            </div>
            <div>
              <Typography.Text strong className="sidebar-brand-title">
                MinIO Cloud
              </Typography.Text>
              <Typography.Text className="sidebar-brand-subtitle">多云对象存储管理</Typography.Text>
            </div>
          </div>
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
                { key: 'settings', icon: <SettingOutlined />, label: '设置' },
                ...(showDeveloperDebug
                  ? [{ key: 'developerDebug', icon: <ExperimentOutlined />, label: '开发调试' }]
                  : [])
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
