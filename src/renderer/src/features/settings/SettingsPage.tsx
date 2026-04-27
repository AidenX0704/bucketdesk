import { Card, Col, Form, InputNumber, Row, Select, Switch, Typography } from 'antd'

export function SettingsPage(): React.JSX.Element {
  return (
    <Row gutter={16}>
      <Col span={14}>
        <Card title="传输设置" className="surface-card">
          <Form layout="vertical" initialValues={{ concurrency: 3, theme: 'light', logs: true }}>
            <Form.Item label="全局并发任务数" name="concurrency" extra="建议 2–5，过高可能触发云厂商限流。">
              <InputNumber min={1} max={16} className="full-width" />
            </Form.Item>
            <Form.Item label="界面主题" name="theme">
              <Select
                options={[
                  { label: '浅色专业后台', value: 'light' },
                  { label: '深色模式（规划中）', value: 'dark', disabled: true }
                ]}
              />
            </Form.Item>
            <Form.Item label="记录操作日志" name="logs" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col span={10}>
        <Card title="安全策略" className="surface-card">
          <Typography.Paragraph>
            密钥仅在主进程解密使用，渲染进程不会读取明文 Secret Key。上传、下载和云 SDK
            调用均通过受控 IPC 完成。
          </Typography.Paragraph>
          <Typography.Paragraph type="secondary">
            后续可扩展系统钥匙串、代理、自签名证书信任和审计日志导出。
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  )
}
