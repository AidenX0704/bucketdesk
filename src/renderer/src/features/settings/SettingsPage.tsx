import { LockOutlined, SettingOutlined } from '@ant-design/icons'
import { Card, Col, Form, InputNumber, Row, Select, Switch, Typography, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'

interface SettingsPageProps {
  themeMode: 'light' | 'dark'
  onThemeChange: (mode: 'light' | 'dark') => void
}

export function SettingsPage({ themeMode, onThemeChange }: SettingsPageProps): React.JSX.Element {
  const [concurrency, setConcurrency] = useState(3)
  const [logs, setLogs] = useState(true)

  const loadSettings = useCallback(async () => {
    const [concResult, logsResult] = await Promise.all([
      window.api.settings.get<number>('concurrency'),
      window.api.settings.get<boolean>('logs')
    ])
    if (concResult.ok && concResult.data !== undefined) setConcurrency(concResult.data)
    if (logsResult.ok && logsResult.data !== undefined) setLogs(logsResult.data)
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleConcurrencyChange = async (value: number | null): Promise<void> => {
    if (value === null) return
    setConcurrency(value)
    const result = await window.api.settings.set('concurrency', value)
    if (!result.ok) message.error(result.error.message)
  }

  const handleThemeChange = async (value: 'light' | 'dark'): Promise<void> => {
    onThemeChange(value)
    const result = await window.api.settings.set('theme', value)
    if (!result.ok) message.error(result.error.message)
  }

  const handleLogsChange = async (checked: boolean): Promise<void> => {
    setLogs(checked)
    const result = await window.api.settings.set('logs', checked)
    if (!result.ok) message.error(result.error.message)
  }

  return (
    <Row gutter={[20, 20]}>
      <Col span={14}>
        <Card
          title={
            <span>
              <SettingOutlined style={{ marginRight: 8, color: 'var(--brand-primary)' }} />
              传输设置
            </span>
          }
          className="surface-card settings-card"
        >
          <Form layout="vertical">
            <Form.Item label="全局并发任务数" extra="建议 2–5，过高可能触发云厂商限流。">
              <InputNumber
                min={1}
                max={16}
                className="full-width"
                value={concurrency}
                onChange={handleConcurrencyChange}
              />
            </Form.Item>
            <Form.Item label="界面主题">
              <Select
                value={themeMode}
                onChange={handleThemeChange}
                options={[
                  { label: '浅色模式', value: 'light' },
                  { label: '深色模式', value: 'dark' }
                ]}
              />
            </Form.Item>
            <Form.Item label="记录操作日志">
              <Switch checked={logs} onChange={handleLogsChange} />
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col span={10}>
        <Card
          title={
            <span>
              <LockOutlined style={{ marginRight: 8, color: 'var(--color-success)' }} />
              安全策略
            </span>
          }
          className="surface-card settings-card"
        >
          <Typography.Paragraph style={{ marginBottom: 12 }}>
            密钥仅在主进程解密使用，渲染进程不会读取明文 Secret Key。上传、下载和云 SDK
            调用均通过受控 IPC 完成。
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            后续可扩展系统钥匙串、代理、自签名证书信任和审计日志导出。
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  )
}
