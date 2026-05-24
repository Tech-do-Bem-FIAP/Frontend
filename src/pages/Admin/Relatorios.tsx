import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import {
  ArrowLeft,
  Loader2,
  Printer,
  RefreshCw,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import { gerarRelatorios } from "../../api/relatorios";
import type { RelatorioResponse } from "../../api/relatorios";
import { ApiError } from "../../api/client";

function fmtData(iso: string): string {
  if (!iso) return "—";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export default function Relatorios() {
  const { user } = useAuth();
  const [data, setData] = useState<RelatorioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const r = await gerarRelatorios();
      setData(r);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 0
            ? "Não foi possível conectar ao backend."
            : err.message
          : "Erro ao gerar relatórios.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void carregar(); }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.cargo !== "Administrador") return <Navigate to={`/${user.role}`} replace />;

  const geradoEm = new Date().toLocaleString("pt-BR");

  return (
    <div className="min-h-screen bg-(--brand-tertiary) print:bg-white">
      <div className="print:hidden">
        <DashboardHeader />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 print:max-w-none print:px-0 print:py-2">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            to="/colaborador"
            className="inline-flex items-center gap-1.5 text-sm text-(--brand-primary) hover:text-(--brand-secondary) font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao painel
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void carregar()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </button>
            <button
              onClick={() => window.print()}
              disabled={loading || !data}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-(--brand-primary) hover:bg-(--brand-secondary) text-white rounded-lg disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
          </div>
        </div>

        <header className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm print:border-0 print:shadow-none print:p-0">
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6 text-(--brand-primary) print:hidden" />
            <h1 className="text-xl font-bold text-(--brand-secondary)">
              Relatórios — Tech do Bem
            </h1>
          </div>
          <p className="text-xs text-(--text-secondary-color)">
            Gerado em {geradoEm} por {user.nome} ({user.cargo}).
          </p>
        </header>

        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex items-center justify-center gap-2 text-(--text-secondary-color)">
            <Loader2 className="w-5 h-5 animate-spin" /> Consultando o banco...
          </div>
        )}

        {erro && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
            <p className="text-sm text-red-900">{erro}</p>
          </div>
        )}

        {data && !loading && (
          <>
            {}
            <Secao
              numero={1}
              titulo="Visão geral dos pacientes"
              subtitulo="Função numérica simples — AVG / MIN / MAX"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Idade média" valor={`${data.idadeStats.idadeMedia} anos`} />
                <Stat label="Pacientes" valor={data.idadeStats.total} />
                <Stat label="Mais novo" valor={`${data.idadeStats.maisNovo} anos`} />
                <Stat label="Mais velho" valor={`${data.idadeStats.maisVelho} anos`} />
              </div>
            </Secao>

            {}
            <Secao
              numero={2}
              titulo="Top 10 dentistas por número de pacientes"
              subtitulo="Classificação de dados — ORDER BY + GROUP BY"
            >
              <Tabela cabecalhos={["#", "Dentista", "Especialidade", "Pacientes"]}>
                {data.rankingDentistas.map((d, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-(--text-secondary-color)">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{d.nome}</td>
                    <td className="px-3 py-2 text-(--text-secondary-color)">{d.especialidade}</td>
                    <td className="px-3 py-2 text-right font-semibold">{d.qtdPacientes}</td>
                  </tr>
                ))}
              </Tabela>
            </Secao>

            {}
            <Secao
              numero={3}
              titulo="Atendimentos por status"
              subtitulo="Função de grupo — COUNT / MIN / MAX com HAVING"
            >
              <Tabela cabecalhos={["Status", "Quantidade", "Primeiro", "Último"]}>
                {data.atendimentosPorStatus.map((s, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{s.status}</td>
                    <td className="px-3 py-2 text-right font-semibold">{s.quantidade}</td>
                    <td className="px-3 py-2 text-(--text-secondary-color)">
                      {fmtData(s.primeiroAtendimento)}
                    </td>
                    <td className="px-3 py-2 text-(--text-secondary-color)">
                      {fmtData(s.ultimoAtendimento)}
                    </td>
                  </tr>
                ))}
              </Tabela>
            </Secao>

            {}
            <Secao
              numero={4}
              titulo="Dentistas acima da média de pacientes"
              subtitulo="Sub-consulta — comparação contra AVG agregada"
            >
              {data.dentistasAcimaMedia.length === 0 ? (
                <p className="text-sm text-(--text-secondary-color) py-3">
                  Nenhum dentista acima da média atual.
                </p>
              ) : (
                <Tabela cabecalhos={["ID", "Dentista", "Pacientes"]}>
                  {data.dentistasAcimaMedia.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-(--text-secondary-color)">{d.id}</td>
                      <td className="px-3 py-2 font-medium">{d.nome}</td>
                      <td className="px-3 py-2 text-right font-semibold">{d.qtdPacientes}</td>
                    </tr>
                  ))}
                </Tabela>
              )}
            </Secao>

            {}
            <Secao
              numero={5}
              titulo="Últimos 20 atendimentos"
              subtitulo="Junção de tabelas — INNER JOIN paciente + dentista + campanha"
            >
              <Tabela cabecalhos={["#", "Data", "Tipo", "Status", "Paciente", "Dentista", "Campanha"]}>
                {data.ultimosAtendimentos.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-(--text-secondary-color)">{a.id}</td>
                    <td className="px-3 py-2">{fmtData(a.data)}</td>
                    <td className="px-3 py-2 text-(--text-secondary-color)">{a.tipo}</td>
                    <td className="px-3 py-2">{a.status}</td>
                    <td className="px-3 py-2 font-medium">{a.paciente}</td>
                    <td className="px-3 py-2">
                      {a.dentista}
                      <span className="block text-xs text-(--text-secondary-color)">
                        {a.especialidade}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-(--text-secondary-color)">{a.campanha}</td>
                  </tr>
                ))}
              </Tabela>
            </Secao>
          </>
        )}
      </main>
    </div>
  );
}

function Secao({
  numero,
  titulo,
  subtitulo,
  children,
}: {
  numero: number;
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm print:break-inside-avoid print:shadow-none">
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-wider text-(--text-secondary-color)">
          Relatório {numero}
        </p>
        <h2 className="font-semibold text-(--brand-secondary)">{titulo}</h2>
        <p className="text-xs text-(--text-secondary-color)">{subtitulo}</p>
      </div>
      {children}
    </section>
  );
}

function Stat({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="bg-(--brand-tertiary) rounded-lg p-3 print:border print:border-gray-200 print:bg-white">
      <p className="text-xs text-(--text-secondary-color)">{label}</p>
      <p className="text-xl font-bold text-(--brand-secondary)">{valor}</p>
    </div>
  );
}

function Tabela({
  cabecalhos,
  children,
}: {
  cabecalhos: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-(--brand-tertiary) text-(--text-secondary-color)">
          <tr>
            {cabecalhos.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
