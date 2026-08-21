import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-5 bg-[#f0f2f5]">
          <div className="max-w-md w-full text-center bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <span className="text-4xl">😕</span>
            <h1 className="text-xl font-bold mt-4 mb-2 text-slate-800">Kuch Galat Ho Gaya</h1>
            <p className="text-sm text-slate-500 mb-6">
              Is screen ko load karte waqt ek error aa gaya. Reload karke dobara try karo — agar problem bani rahe, browser console check karo.
            </p>
            <button
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-all cursor-pointer border-0"
              onClick={this.handleReload}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
