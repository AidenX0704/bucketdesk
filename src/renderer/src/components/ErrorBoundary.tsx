import { Button, Result } from 'antd'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | undefined
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: undefined }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', padding: 48 }}>
          <Result
            status="error"
            title="页面出现错误"
            subTitle={this.state.error?.message}
            extra={
              <Button type="primary" onClick={this.handleReset}>
                重试
              </Button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}
