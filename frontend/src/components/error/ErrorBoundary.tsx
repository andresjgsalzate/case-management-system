import React, { Component, ErrorInfo, ReactNode } from "react";
import { ActionIcon } from "../ui/ActionIcons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 ErrorBoundary caught an error:", error, errorInfo);

    // Enviar error a servicio de logging si está disponible
    this.props.onError?.(error, errorInfo);

    // En desarrollo, mostrar detalles completos
    if (import.meta.env.DEV) {
      console.group("🔍 Error Boundary - Detalles completos:");
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo.componentStack);
      console.error("Error Stack:", error.stack);
      console.groupEnd();
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <ActionIcon action="error" size="lg" color="red" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Oops! Algo salió mal
            </h1>

            <p className="text-gray-600 mb-6">
              Ha ocurrido un error inesperado en la aplicación. Puedes intentar
              recargar la página o contactar al soporte técnico.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
                <h3 className="font-medium text-red-800 mb-2">
                  Detalles del error (desarrollo):
                </h3>
                <code className="text-sm text-red-700 break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Intentar nuevamente
              </button>

              <button
                onClick={this.handleRefresh}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors duration-200"
              >
                Recargar página
              </button>

              <button
                onClick={() => window.history.back()}
                className="w-full text-gray-600 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Ir atrás
              </button>
            </div>

            {!import.meta.env.DEV && (
              <p className="text-xs text-gray-500 mt-4">
                ID del error: {Date.now().toString(36)}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para usar el Error Boundary programáticamente
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const throwError = (error: Error) => {
    setError(error);
  };

  const resetError = () => {
    setError(null);
  };

  return { throwError, resetError };
};
