import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('❌ Erro capturado pelo boundary:', error, info);
    
    // 🔥 Melhoria: Log para serviço de monitoramento (opcional)
    if (process.env.NODE_ENV === 'production') {
      // Enviar para serviço de tracking (Sentry, etc.)
      // sendToErrorTracking(error, info);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#e0e0e0',
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{
            maxWidth: '500px',
            background: '#111',
            padding: '32px',
            borderRadius: '16px',
            border: '1px solid #ff444420',
          }}>
            <h1 style={{ color: '#ff4444', marginBottom: '16px', fontSize: '28px' }}>
              ⚠️ Algo deu errado
            </h1>
            <p style={{ color: '#a0a0a0', marginBottom: '24px', lineHeight: '1.6' }}>
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            {this.state.error && (
              <pre style={{
                background: '#1a1a1a',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#ff8888',
                overflow: 'auto',
                marginBottom: '24px',
                maxHeight: '150px',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#00e5ff',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                🔄 Recarregar Página
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'transparent',
                  border: '1px solid #00e5ff',
                  color: '#00e5ff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#00e5ff20';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                🏠 Ir para o Início
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}