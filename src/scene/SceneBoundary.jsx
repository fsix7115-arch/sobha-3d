import { Component } from 'react'

/**
 * Catches anything the 3D layer throws (WebGL context loss, a failed chunk
 * download, a driver error) and keeps the page usable: the DOM content is
 * outside this boundary, so the site never goes blank.
 */
export default class SceneBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.warn('[scene] 3D layer disabled:', error?.message || error)
    if (typeof window !== 'undefined') window.__sceneFailed = true
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}
