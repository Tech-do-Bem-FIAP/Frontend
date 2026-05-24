import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Loader2, Activity, AlertTriangle } from "lucide-react";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import { getTodosPacientes } from "../../data/api";
import { predizerDemanda } from "../../api/ml";
import type { PredicaoML, ClasseDemanda } from "../../api/ml";
import type { Paciente } from "../../types";

const CLASSES_ORDEM: ClasseDemanda[] = ["Baixa", "Media", "Alta"];

const COR_CLASSE: Record<ClasseDemanda, { bg: string; text: string; bar: string }> = {
  Baixa: { bg: "bg-green-100", text: "text-green-800", bar: "bg-green-500" },
  Media: { bg: "bg-amber-100", text: "text-amber-800", bar: "bg-amber-500" },
  Alta: { bg: "bg-red-100", text: "text-red-800", bar: "bg-red-500" },
};

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export default function Area() {
  const params = useParams<{ bairro: string }>();
  const bairro = decodeURIComponent(params.bairro || "");

  const [predicao, setPredicao] = useState<PredicaoML | null>(null);
  const [predicaoErr, setPredicaoErr] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataErr, setDataErr] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setDataErr(null);
    setPredicaoErr(null);
    setPredicao(null);
    try {

      const todos = await getTodosPacientes();
      const alvo = bairro.trim().toLowerCase();
      setPacientes(
        todos.filter((p) => (p.bairro ?? "").trim().toLowerCase() === alvo),
      );
    } catch {
      setDataErr("Não foi possível carregar os pacientes.");
    } finally {
      setLoading(false);
    }

    try {
      const p = await predizerDemanda({ bairro });
      setPredicao(p);
    } catch {
      setPredicaoErr("Predição indisponível no momento.");
    }
  }, [bairro]);

  useEffect(() => { void carregar(); }, [carregar]);

  const cores = predicao ? COR_CLASSE[predicao.classe] : null;

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

        {}
        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-(--text-secondary-color)">
            Área
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap mt-1">
            <h1 className="text-2xl font-bold text-(--brand-secondary)">{bairro}</h1>
            {predicao && cores && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${cores.bg} ${cores.text}`}
              >
                <Activity className="w-4 h-4" /> Demanda {predicao.classe}
              </span>
            )}
          </div>
        </section>

        {}
        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-(--brand-secondary)">
            Predição do modelo
          </h2>

          {!predicao && !predicaoErr && (
            <div className="flex items-center gap-2 text-(--text-secondary-color) text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Consultando modelo de ML...
            </div>
          )}

          {predicaoErr && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">{predicaoErr}</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Os dados dos pacientes continuam exibidos abaixo.
                </p>
              </div>
            </div>
          )}

          {predicao && (
            <>
              <p className="text-xs text-(--text-secondary-color)">
                Modelo: <span className="font-medium text-(--text-color)">{predicao.modelo_versao}</span>
              </p>
              <div className="space-y-2">
                {CLASSES_ORDEM.map((c) => {
                  const v = predicao.probabilidades[c] ?? 0;
                  const cls = COR_CLASSE[c];
                  return (
                    <div key={c}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-medium ${cls.text}`}>{c}</span>
                        <span className="text-(--text-color)">{pct(v)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cls.bar} transition-all`}
                          style={{ width: `${(v * 100).toFixed(2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-(--text-color) pt-2 border-t border-gray-100">
                O modelo classificou este bairro como demanda{" "}
                <span className="font-semibold">{predicao.classe}</span> com confiança{" "}
                <span className="font-semibold">
                  {pct(predicao.probabilidades[predicao.classe] ?? 0)}
                </span>.
              </p>
            </>
          )}
        </section>

        {}
        <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="font-semibold text-(--brand-secondary)">
            Pacientes nesta área
          </h2>

          {loading && (
            <div className="flex items-center gap-2 text-(--text-secondary-color) text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando pacientes...
            </div>
          )}

          {!loading && dataErr && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
              {dataErr}
            </p>
          )}

          {!loading && !dataErr && pacientes.length === 0 && (
            <p className="text-(--text-secondary-color) text-sm py-3">
              Nenhum paciente cadastrado nesta área.
            </p>
          )}

          {!loading && pacientes.map((p) => (
            <div
              key={p.id}
              className="border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-lg p-3"
            >
              <p className="font-semibold text-(--brand-secondary)">{p.nome}</p>
              <p className="text-xs text-(--text-secondary-color) mt-0.5">
                {p.email} · {p.telefone}
              </p>
              {p.logradouro && (
                <p className="text-xs text-(--text-secondary-color) mt-0.5">
                  {p.logradouro}{p.cep ? ` · CEP ${p.cep}` : ""}
                </p>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
