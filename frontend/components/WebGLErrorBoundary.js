import React from 'react';

/**
 * Error boundary that catches crashes from WebGL / Three.js components
 * and renders a graceful fallback instead of crashing the entire page.
 *
 * Usage:
 *   <WebGLErrorBoundary fallback={<div>3D unavailable</div>}>
 *     <Hero3D />
 *   </WebGLErrorBoundary>
 */
export default class WebGLErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log for debugging but don't crash the page
    console.warn('[WebGL] 3D component failed to render:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50">
            <div className="text-center p-6">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-sm text-slate-400 font-medium">3D view unavailable</p>
              <p className="text-xs text-slate-300 mt-1">Your browser may not support WebGL</p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
