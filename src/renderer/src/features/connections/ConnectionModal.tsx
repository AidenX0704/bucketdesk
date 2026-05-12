import {
  ApiOutlined,
  CloudServerOutlined,
  KeyOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { Col, Divider, Form, Input, Modal, Row, Select, Space, Switch, Typography } from 'antd'
import { useEffect } from 'react'
import type {
  ConnectionSummary,
  CreateConnectionInput,
  UpdateConnectionInput
} from '../../../../shared/types/connection'
import type { ProviderType } from '../../../../shared/types/provider'

interface ConnectionModalProps {
  open: boolean
  connection?: ConnectionSummary
  onCancel: () => void
  onCreate: (input: CreateConnectionInput) => Promise<void>
  onUpdate: (input: UpdateConnectionInput) => Promise<void>
}

const providerOptions: { label: string; value: ProviderType }[] = [
  { label: 'MinIO', value: 'minio' },
  { label: 'S3 Compatible', value: 's3-compatible' },
  { label: '阿里云 OSS', value: 'aliyun-oss' },
  { label: '腾讯云 COS', value: 'tencent-cos' }
]

const defaultValues: Partial<CreateConnectionInput> = {
  providerType: 'minio',
  useSsl: true,
  pathStyle: true
}

export function ConnectionModal({
  open,
  connection,
  onCancel,
  onCreate,
  onUpdate
}: ConnectionModalProps): React.JSX.Element {
  const [form] = Form.useForm<CreateConnectionInput>()
  const isEditing = Boolean(connection)

  useEffect(() => {
    if (!open) return

    if (connection) {
      form.setFieldsValue({
        name: connection.name,
        providerType: connection.providerType,
        endpoint: connection.endpoint,
        region: connection.region,
        accessKeyId: connection.accessKeyId,
        secretAccessKey: '',
        useSsl: connection.useSsl,
        pathStyle: connection.pathStyle
      })
      return
    }

    form.setFieldsValue(defaultValues)
  }, [connection, form, open])

  const handleSubmit = async (): Promise<void> => {
    const values = await form.validateFields()

    if (connection) {
      const secretAccessKey = values.secretAccessKey?.trim()
      await onUpdate({
        id: connection.id,
        ...values,
        secretAccessKey: secretAccessKey || undefined
      })
      return
    }

    await onCreate(values)
  }

  return (
    <Modal
      title={
        <Space className="connection-modal-title" size={10}>
          <CloudServerOutlined style={{ fontSize: 18, color: 'var(--brand-primary)' }} />
          <span style={{ fontWeight: 600 }}>{isEditing ? '编辑云存储连接' : '新建云存储连接'}</span>
        </Space>
      }
      open={open}
      width={720}
      centered
      okText={isEditing ? '保存修改' : '保存连接'}
      cancelText="取消"
      onCancel={onCancel}
      onOk={() => {
        void handleSubmit()
      }}
      afterClose={() => form.resetFields()}
      styles={{ body: { paddingTop: 12 } }}
      rootStyle={{ top: 40 }}
    >
      <Typography.Paragraph
        type="secondary"
        className="connection-modal-desc"
        style={{ fontSize: 13 }}
      >
        {isEditing
          ? '修改连接名称、Endpoint 或访问密钥后保存，列表和当前连接会重新刷新。Secret Key 留空时沿用原密钥。'
          : '仅需填写连接名称、Endpoint 和访问密钥。高级选项已默认按 MinIO / S3 兼容场景配置。'}
      </Typography.Paragraph>

      <Form form={form} layout="vertical" requiredMark="optional" initialValues={defaultValues}>
        <div className="form-section">
          <div className="form-section-title">
            <ApiOutlined />
            <span>基础信息</span>
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="连接名称"
                rules={[{ required: true, message: '请输入连接名称' }]}
              >
                <Input placeholder="例如：本地 MinIO" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="providerType"
                label="云厂商"
                rules={[{ required: true, message: '请选择云厂商' }]}
              >
                <Select options={providerOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item
                name="endpoint"
                label="Endpoint"
                rules={[{ required: true, message: '请输入 Endpoint' }]}
              >
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
              <Form.Item
                name="accessKeyId"
                label="Access Key"
                rules={[{ required: true, message: '请输入 Access Key' }]}
              >
                <Input autoComplete="off" placeholder="Access Key ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="secretAccessKey"
                label="Secret Key"
                rules={isEditing ? [] : [{ required: true, message: '请输入 Secret Key' }]}
              >
                <Input.Password
                  autoComplete="new-password"
                  placeholder={isEditing ? '留空则沿用原 Secret Key' : 'Secret Access Key'}
                />
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
            <Form.Item
              name="useSsl"
              label="使用 SSL"
              valuePropName="checked"
              className="switch-item"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="pathStyle"
              label="Path Style"
              valuePropName="checked"
              className="switch-item"
            >
              <Switch />
            </Form.Item>
          </Space>
        </div>
      </Form>
    </Modal>
  )
}
