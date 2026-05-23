import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.assign("/");
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-(--brand-tertiary) flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="title3 font-bold mt-4 text-(--brand-secondary)">
            Algo deu errado
          </h1>
          <p className="text-sm text-(--text-color) mt-3 leading-relaxed">
            Encontramos um problema inesperado ao exibir esta tela. Tente recarregar
            a aplicação. Se o erro continuar, avise um administrador.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-xs text-left bg-red-50 border border-red-200 rounded p-2 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="mt-6 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }
}
