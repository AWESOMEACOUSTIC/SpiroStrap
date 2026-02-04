import React from "react";

function DefaultFallback({ error, onReset }) {
  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
      <div className="text-sm font-semibold text-slate-100">
        Something went wrong
      </div>
      <div className="mt-2 text-xs text-slate-400">
        The app hit an unexpected error while rendering this page.
      </div>

      <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-slate-950/50 p-3 text-xs text-slate-200">
        {String(error?.message ?? error)}
      </pre>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
          onClick={onReset}
        >
          Try again
        </button>

        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error);
  }

  handleReset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (error) {
      if (Fallback) {
        return <Fallback error={error} onReset={this.handleReset} />;
      }
      return <DefaultFallback error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}