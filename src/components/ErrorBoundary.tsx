import { Component, type ErrorInfo, type ReactNode } from "react";
import { ArchiveDataError } from "../data/ingen";
import DataError from "../routes/DataError";

interface State {
  error: Error | null;
}

/**
 * Catches data-validation failures (and anything else fatal) and renders the
 * designed error state instead of a blank page.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("InGen Archive — unrecoverable render error", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <DataError issues={error instanceof ArchiveDataError ? error.issues : [error.message]} />;
  }
}
