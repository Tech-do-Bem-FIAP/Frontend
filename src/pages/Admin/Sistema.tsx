import { useState } from "react";
import { Link, Navigate } from "react-router";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Database,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import { reconstruirBanco } from "../../api/admin";
import type { AdminRebuildResponse } from "../../api/admin";
import { ApiError } from "../../api/client";

const PALAVRA_CONFIRMACAO = "RECONSTRUIR";

export default function Sistema() {
  const { user } = useAuth();
  const [senha, setSenha] = useState("");
  const [palavra, setPalavra] = useState("");
  const [executando, setExecutando] = useState(false);
  const [resultado, setResultado] = useState<AdminRebuildResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;
  if (user.email !== "admin@admin.com") return <Navigate to={`/${user.role}`} replace />;

  const podeExecutar =
    palavra === PALAVRA_CONFIRMACAO && senha.length > 0 && !executando;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeExecutar) return;

    setExecutando(true);
    setErro(null);
    setResultado(null);

    try {
      const r = await reconstruirBanco({
        email: user.email,
        senha,
        confirmacao: palavra,
      });
      setResultado(r);
      setSenha("");
      setPalavra("");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 0
            ? "Não foi possível conectar ao backend."
            : err.message
          : "Erro inesperado ao reconstruir o banco.";
      setErro(msg);
    } finally {
      setExecutando(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--brand-tertiary)">
      <DashboardHeader />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link
          to="/colaborador"
          className="inline-flex items-center gap-1.5 text-sm text-(--brand-primary) hover:text-(--brand-secondary) font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao painel
        </Link>

        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-6 h-6 text-(--brand-primary)" />
            <h1 className="text-xl font-bold text-(--brand-secondary)">
              Reconstrução do banco de dados
            </h1>
          </div>
          <p className="text-sm text-(--text-color)">
            Esta operação executa o script seed embarcado no backend
            (<code className="bg-(--brand-tertiary) px-1 rounded">seed/rebuild.sql</code>),
            apagando todas as tabelas e recriando o schema com a massa de dados de
            demonstração (11 colaboradores, 24 dentistas, 240 pacientes e demais
            entidades).
          </p>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900 space-y-1">
            <p className="font-semibold">Atenção</p>
            <p>
              Todos os dados atualmente armazenados serão perdidos. Use apenas em
              ambiente de demonstração ou quando explicitamente solicitado.
            </p>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-(--text-color) mb-1"
              >
                Confirme sua senha
              </label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                disabled={executando}
              />
            </div>

            <div>
              <label
                htmlFor="palavra"
                className="block text-sm font-medium text-(--text-color) mb-1"
              >
                Para prosseguir, digite{" "}
                <code className="bg-(--brand-tertiary) px-1 rounded font-mono">
                  {PALAVRA_CONFIRMACAO}
                </code>
              </label>
              <input
                id="palavra"
                type="text"
                value={palavra}
                onChange={(e) => setPalavra(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) font-mono"
                disabled={executando}
              />
            </div>

            {erro && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={!podeExecutar}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {executando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Reconstruindo...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" /> Reconstruir banco agora
                </>
              )}
            </button>
          </form>
        </section>

        {resultado && (
          <section
            className={`border rounded-xl p-5 shadow-sm space-y-3 ${
              resultado.sucesso
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {resultado.sucesso ? (
                <CheckCircle2 className="w-5 h-5 text-green-700" />
              ) : (
                <XCircle className="w-5 h-5 text-red-700" />
              )}
              <h2
                className={`font-semibold ${
                  resultado.sucesso ? "text-green-900" : "text-red-900"
                }`}
              >
                {resultado.sucesso
                  ? "Banco reconstruído com sucesso"
                  : "Reconstrução concluiu com erros"}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white/60 rounded p-2">
                <p className="text-xs text-(--text-secondary-color)">
                  Statements executados
                </p>
                <p className="font-semibold text-lg">
                  {resultado.statementsExecutados}
                </p>
              </div>
              <div className="bg-white/60 rounded p-2">
                <p className="text-xs text-(--text-secondary-color)">
                  SELECTs pulados (relatórios)
                </p>
                <p className="font-semibold text-lg">
                  {resultado.statementsPulados}
                </p>
              </div>
            </div>

            {resultado.erros.length > 0 && (
              <details className="bg-white/60 rounded p-3 text-xs">
                <summary className="cursor-pointer font-medium">
                  Mensagens do banco ({resultado.erros.length})
                </summary>
                <ul className="mt-2 space-y-1 max-h-64 overflow-y-auto font-mono">
                  {resultado.erros.map((linha, i) => (
                    <li
                      key={i}
                      className={
                        linha.startsWith("Erro:") ? "text-red-800" : "text-amber-800"
                      }
                    >
                      {linha}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
