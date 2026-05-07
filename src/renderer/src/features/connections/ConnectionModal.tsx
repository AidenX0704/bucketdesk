import { ApiOutlined, CloudServerOutlined, KeyOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { Col, Divider, Form, Input, Modal, Row, Select, Space, Switch, Typography } from 'antd'
import type { CreateConnectionInput } from '../../../../shared/types/connection'
import type { ProviderType } from '../../../../shared/types/provider'

interface ConnectionModalProps {
  open: boolean
  onCancel: () => void
  onSubmit: (input: CreateConnectionInput) => Promise<void>
}

const providerOptions: { label: string; value: ProviderType }[] = [
  { label: 'MinIO', value: 'minio' },
  { label: 'S3 Compatible', value: 's3-compatible' },
  { label: '阿里云 OSS', value: 'aliyun-oss' },
  { label: '腾讯云 COS', value: 'tencent-cos' }
]

export function ConnectionModal({ open, onCancel, onSubmit }: ConnectionModalProps): React.JSX.Element {
  const [form] = Form.useForm<CreateConnectionInput>()

  return (
    <Modal
      title={
        <Space className="connection-modal-title" size={10}>
          <CloudServerOutlined style={{ fontSize: 18, color: 'var(--brand-primary)' }} />
          <span style={{ fontWeight: 600 }}>新建云存储连接</span>
        </Space>
      }
      open={open}
      width={720}
      centered
      okText="保存连接"
      cancelText="取消"
      onCancel={onCancel}
      onOk={() => {
        void form.validateFields().then(onSubmit)
      }}
      afterClose={() => form.resetFields()}
      styles={{ body: { paddingTop: 12 } }}
      rootStyle={{ top: 40 }}
    >
      <Typography.Paragraph type="secondary" className="connection-modal-desc" style={{ fontSize: 13 }}>
        仅需填写连接名称、Endpoint 和访问密钥。高级选项已默认按 MinIO / S3 兼容场景配置。
      </Typography.Paragraph>

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ providerType: 'minio', useSsl: true, pathStyle: true }}
      >
        <div className="form-section">
          <div className="form-section-title">
            <ApiOutlined />
            <span>基础信息</span>
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="name" label="连接名称" rules={[{ required: true, message: '请输入连接名称' }]}>
                <Input placeholder="例如：本地 MinIO" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="providerType" label="云厂商" rules={[{ required: true, message: '请选择云厂商' }]}>
                <Select options={providerOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="endpoint" label="Endpoint" rules={[{ required: true, message: '请输入 Endpoint' }]}>
                <Input placeholder="http://127.0.0.1:9000" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="region" label="Region">
                <Input placeholder="us-east-1" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider className="compact-divider" />

        <div className="form-section">
          <div className="form-section-title">
            <KeyOutlined />
            <span>访问凭证</span>
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="accessKeyId" label="Access Key" rules={[{ required: true, message: '请输入 Access Key' }]}>
                <Input autoComplete="off" placeholder="Access Key ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="secretAccessKey" label="Secret Key" rules={[{ required: true, message: '请输入 Secret Key' }]}>
                <Input.Password autoComplete="new-password" placeholder="Secret Access Key" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider className="compact-divider" />

        <div className="advanced-row">
          <div className="form-section-title advanced-title">
            <SafetyCertificateOutlined />
            <span>高级选项</span>
          </div>
          <Space size={24} wrap>
            <Form.Item name="useSsl" label="使用 SSL" valuePropName="checked" className="switch-item">
              <Switch />
            </Form.Item>
            <Form.Item name="pathStyle" label="Path Style" valuePropName="checked" className="switch-item">
              <Switch />
            </Form.Item>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}
