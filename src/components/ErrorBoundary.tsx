import { Component, type ReactNode } from 'react'
import i18n from '../i18n'


interface Properties { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Properties, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <p className="error-screen-title">{i18n.t('errors.title')}</p>
          <p className="error-screen-msg">{this.state.error.message}</p>
          <button
            className="btn-primary"
            style={{ maxWidth: 200 }}
            onClick={() => this.setState({ error: null })}
          >
            {i18n.t('errors.tryAgain')}
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
