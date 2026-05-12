import { CloudSyncOutlined, ExperimentOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Row, Select, Typography, message } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import type { UpdateChannel, UpdateCheckResult } from '../../../../shared/types/update'

export function DeveloperDebugPage(): React.JSX.Element {
  const [updateChannel, setUpdateChannel] = useState<UpdateChannel>('stable')
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [lastCheckResult, setLastCheckResult] = useState<UpdateCheckResult>()

  const loadSettings = useCallback(async () => {
    const result = await window.api.settings.get<UpdateChannel>('updateChannel')
    if (result.ok && result.data !== undefined) {
      setUpdateChannel(result.data)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleUpdateChannelChange = async (value: UpdateChannel): Promise<void> => {
    setUpdateChannel(value)
    setLastCheckResult(undefined)
    const result = await window.api.settings.set('updateChannel', value)
    if (!result.ok) message.error(result.error.message)
  }

  const handleCheckUpdate = async (): Promise<void> => {
    setCheckingUpdate(true)
    const result = await window.api.updates.check({ channel: updateChannel })
    setCheckingUpdate(false)

    if (!result.ok) {
      message.error(result.error.message)
      return
    }

    setLastCheckResult(result.data)
    if (result.data.available) {
      message.success(`发现新版本 ${result.data.version}`)
    } else {
      message.success('当前已是最新版本')
    }
  }

  return (
    <Row gutter={[20, 20]}>
      <Col span={14}>
        <Card
          title={
            <span>
              <ExperimentOutlined className="card-title-icon card-title-icon-warning" />
              升级调试
            </span>
          }
          className="surface-card settings-card"
        >
          <Form layout="vertical">
            <Form.Item label="更新通道" extra="开发通道仅用于企业内部测试包验证。">
              <Select
                value={updateChannel}
                onChange={handleUpdateChannelChange}
                options={[
                  { label: '稳定通道', value: 'stable' },
                  { label: '开发通道', value: 'dev' }
                ]}
              />
            </Form.Item>
            <Form.Item label="升级检查">
              <div className="debug-update-action">
                <Button
                  icon={<CloudSyncOutlined />}
                  loading={checkingUpdate}
                  onClick={() => void handleCheckUpdate()}
                >
                  检查更新
                </Button>
                {lastCheckResult ? (
                  <Typography.Text type="secondary">
                    {lastCheckResult.available
                      ? `发现新版本 ${lastCheckResult.version}`
                      : `当前版本 ${lastCheckResult.currentVersion} 已是最新`}
                  </Typography.Text>
                ) : null}
              </div>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  )
}
