import { Component, type ReactNode } from 'react'


interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <p className="error-screen-title">Something went wrong</p>
          <p className="error-screen-msg">{this.state.error.message}</p>
          <button
            className="btn-primary"
            style={{ maxWidth: 200 }}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
