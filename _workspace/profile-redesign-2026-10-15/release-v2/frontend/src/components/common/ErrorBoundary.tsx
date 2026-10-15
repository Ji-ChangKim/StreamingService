import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPage } from '../pages/ErrorPage';
import { Language } from '../../utils/i18n';

interface Props {
  children: ReactNode;
  currentLang?: Language;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code="500"
          message={this.state.error?.message}
          onNavigateHome={this.handleReset}
          currentLang={this.props.currentLang || 'ko'}
        />
      );
    }

    return this.props.children;
  }
}
