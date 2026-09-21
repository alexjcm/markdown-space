import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-svh flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-text-primary">Something went wrong.</p>
          <p className="text-sm text-text-secondary">
            Your documents are still saved on this device.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-11 rounded-md bg-accent px-6 text-white"
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
