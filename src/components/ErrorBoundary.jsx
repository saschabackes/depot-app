import { Component } from 'react'

// Fängt Renderfehler ab, statt die ganze App weiß werden zu lassen
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('🔴 Unerwarteter Fehler:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-3">😕</div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Da ist etwas schiefgelaufen</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Deine Daten sind sicher gespeichert. Lade die App neu, um weiterzumachen.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary w-full py-3 text-sm font-semibold">
            App neu laden
          </button>
        </div>
      </div>
    )
  }
}
