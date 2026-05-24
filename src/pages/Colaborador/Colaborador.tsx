import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import {
  Users,
  Bell,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  UserCircle,
  Megaphone,
  Stethoscope,
  IdCard,
  Inbox,
  Search,
  Calendar,
  AlertCircle,
  Map as MapIcon,
  TrendingUp,
} from "lucide-react";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import { Skeleton, SkeletonText } from "../../components/Skeleton/Skeleton";
import { useAuth } from "../../contexts/AuthContext";
import {
  getDentistasByColaborador,
  getTodosDentistas,
  getTodosColaboradores,
  getPacientesByDentista,
  getAtendimentosByDentista,
  getNotificacoesEnviadasColaborador,
  enviarColaboradorParaDentista,
  getTodosPacientes,
} from "../../data/api";
import { getAnotacoesSobre, saveAnotacao } from "../../data/api";
import { ApiError } from "../../api/client";
import { tempoRelativo, tempoExato } from "../../utils/tempo";
import { temNivel, toPacienteGeolocalizado } from "../../types";
import type { CargoColaborador, Dentista, Notificacao, Anotacao, PacienteGeolocalizado } from "../../types";
import { MapaPacientes } from "../../components/MapaPacientes/MapaPacientes";
import { HeatmapAreas } from "../../components/HeatmapAreas/HeatmapAreas";
import { obterRankingBairros } from "../../api/ml";
import type { ClasseDemanda, RankingItem } from "../../api/ml";
import { PacientesGestao } from "./gestao/PacientesGestao";
import { CampanhasGestao } from "./gestao/CampanhasGestao";
import { DentistasGestao } from "./gestao/DentistasGestao";
import { ColaboradoresGestao } from "./gestao/ColaboradoresGestao";
import { SolicitacoesGestao } from "./gestao/SolicitacoesGestao";

type Tab = "dentistas" | "notificacoes" | "anotacoes" | "solicitacoes" | "mapa" | "analise" | "gestao";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 0 ? "Não foi possível conectar à API." : err.message;
  }
  return "Erro inesperado.";
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
      <p className="text-sm text-red-700">{message}</p>
      <button
        onClick={onRetry}
        className="text-xs text-(--brand-primary) hover:text-(--brand-secondary) font-medium"
      >
        Tentar novamente
      </button>
    </div>
  );
}

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "dentistas", label: "Dentistas", Icon: Users },
  { key: "notificacoes", label: "Notificações", Icon: Bell },
  { key: "anotacoes", label: "Anotações", Icon: FileText },
  { key: "solicitacoes", label: "Solicitações", Icon: Inbox },
  { key: "mapa", label: "Mapa", Icon: MapIcon },
  { key: "analise", label: "Análise", Icon: TrendingUp },
  { key: "gestao", label: "Gestão", Icon: Settings },
];

// ─── Mapa tab ───────────────────────────────────────────────────────────────

function MapaTab() {
  const [pacientes, setPacientes] = useState<PacienteGeolocalizado[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const todos = await getTodosPacientes();
      setTotal(todos.length);
      const geo = todos
        .map(toPacienteGeolocalizado)
        .filter((p): p is PacienteGeolocalizado => p != null);
      setPacientes(geo);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingBlock label="Carregando pacientes no mapa..." />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  const semGeo = total - pacientes.length;

  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-(--text-color)">
        Exibindo <span className="font-semibold text-(--brand-primary)">{pacientes.length}</span>
        {" "}pacientes com coordenadas
        {semGeo > 0 && (
          <span className="text-(--text-secondary-color)">
            {" "}· {semGeo} sem endereço/geocoding
          </span>
        )}.
      </div>
      {pacientes.length === 0 ? (
        <p className="text-center text-(--text-secondary-color) py-8 text-sm">
          Nenhum paciente possui coordenadas cadastradas ainda. Use o formulário de
          paciente pra preencher CEP e localizar no mapa.
        </p>
      ) : (
        <MapaPacientes pacientes={pacientes} />
      )}
    </div>
  );
}

// ─── Análise tab (heatmap ML) ───────────────────────────────────────────────

const CLASSE_CORES: Record<ClasseDemanda, { bg: string; text: string; bar: string }> = {
  Alta:  { bg: "bg-red-50",    text: "text-red-700",    bar: "bg-red-500" },
  Media: { bg: "bg-amber-50",  text: "text-amber-700",  bar: "bg-amber-500" },
  Baixa: { bg: "bg-green-50",  text: "text-green-700",  bar: "bg-green-600" },
};

function AnaliseTab() {
  const [itens, setItens] = useState<RankingItem[]>([]);
  const [versao, setVersao] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await obterRankingBairros();
      setItens(resp.itens);
      setVersao(resp.modelo_versao);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingBlock label="Carregando análise de áreas..." />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  const contagem = itens.reduce(
    (acc, it) => { acc[it.classe] = (acc[it.classe] ?? 0) + 1; return acc; },
    {} as Record<ClasseDemanda, number>,
  );
  const top10 = itens.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-(--brand-secondary)">
              Áreas prioritárias para a Turma do Bem
            </h2>
            <p className="text-xs text-(--text-secondary-color) mt-0.5">
              Modelo: {versao} · {itens.length} bairros analisados
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {(["Alta", "Media", "Baixa"] as ClasseDemanda[]).map((c) => {
            const cor = CLASSE_CORES[c];
            return (
              <div key={c} className={`${cor.bg} rounded-lg p-2`}>
                <p className={`text-2xl font-bold ${cor.text}`}>
                  {contagem[c] ?? 0}
                </p>
                <p className={`text-xs font-medium ${cor.text}`}>{c} demanda</p>
              </div>
            );
          })}
        </div>
      </div>

      <HeatmapAreas itens={itens} />

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-(--brand-secondary) mb-2">
          Top 10 bairros prioritários
        </h3>
        {top10.map((it, idx) => {
          const cor = CLASSE_CORES[it.classe];
          const p = Math.round((it.probabilidades[it.classe] ?? 0) * 100);
          return (
            <Link
              key={it.bairro}
              to={`/colaborador/area/${encodeURIComponent(it.bairro)}`}
              className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-(--brand-tertiary)/50 -mx-1 px-1 rounded transition-colors"
            >
              <span className="text-xs font-medium text-(--text-secondary-color) w-5 text-right">
                {idx + 1}.
              </span>
              <span className="flex-1 text-sm font-medium text-(--text-color)">
                {it.bairro}
              </span>
              <span className={`text-xs font-medium ${cor.text} ${cor.bg} px-2 py-0.5 rounded-full`}>
                {it.classe} · {p}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dentistas tab ──────────────────────────────────────────────────────────

interface DentistaStats {
  dentista: Dentista;
  pacientes: number;
  realizados: number;
  agendados: number;
  /** Atendimentos agendados nos próximos 7 dias. */
  proximos7d: number;
  /** Exames sem resultado preenchido. */
  examesPendentes: number;
}

type OrdenacaoDentistas = "nome" | "atividade" | "pacientes";

function DentistasTab({
  colaboradorId,
  visaoGlobal,
  onIrPara,
}: {
  colaboradorId: number;
  visaoGlobal: boolean;
  onIrPara: (tab: Tab, dentistaId?: number) => void;
}) {
  const [rows, setRows] = useState<DentistaStats[]>([]);
  const [responsaveis, setResponsaveis] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [filtro, setFiltro] = useState("");
  const [filtroEsp, setFiltroEsp] = useState<string>("todas");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoDentistas>("nome");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dentistas = visaoGlobal
        ? await getTodosDentistas()
        : await getDentistasByColaborador(colaboradorId);

      const agora = Date.now();
      const sete_dias = agora + 7 * 24 * 60 * 60 * 1000;

      const stats = await Promise.all(
        dentistas.map(async (d) => {
          const [pacs, ats] = await Promise.all([
            getPacientesByDentista(d.id),
            getAtendimentosByDentista(d.id),
          ]);
          const agendados = ats.filter((a) => a.status === "Agendado");
          const proximos7d = agendados.filter((a) => {
            const t = new Date(a.dt_atendimento).getTime();
            return Number.isFinite(t) && t >= agora && t <= sete_dias;
          }).length;
          const examesPendentes = ats.reduce(
            (acc, a) =>
              acc + a.exames.filter((e) => !e.resultado || !e.resultado.trim()).length,
            0,
          );
          return {
            dentista: d,
            pacientes: pacs.length,
            realizados: ats.filter((a) => a.status === "Realizado").length,
            agendados: agendados.length,
            proximos7d,
            examesPendentes,
          };
        }),
      );
      setRows(stats);

      // Visão global: carrega colaboradores pra mostrar nome do responsável.
      if (visaoGlobal) {
        const colabs = await getTodosColaboradores();
        const m = new Map<number, string>();
        for (const c of colabs) m.set(c.id, c.nome);
        setResponsaveis(m);
      } else {
        setResponsaveis(new Map());
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [colaboradorId, visaoGlobal]);

  useEffect(() => {
    void load();
  }, [load]);

  // Especialidades únicas pro dropdown de filtro.
  const especialidades = Array.from(
    new Set(rows.map((r) => r.dentista.especialidade).filter(Boolean)),
  ).sort();

  // Filtragem + ordenação.
  const visiveis = rows
    .filter((r) => {
      if (filtroEsp !== "todas" && r.dentista.especialidade !== filtroEsp) return false;
      const q = filtro.trim().toLowerCase();
      if (!q) return true;
      return (
        r.dentista.nome.toLowerCase().includes(q) ||
        r.dentista.cro.toLowerCase().includes(q) ||
        r.dentista.especialidade.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (ordenacao === "pacientes") return b.pacientes - a.pacientes;
      if (ordenacao === "atividade") {
        const ativA = a.agendados + a.realizados;
        const ativB = b.agendados + b.realizados;
        return ativB - ativA;
      }
      return a.dentista.nome.localeCompare(b.dentista.nome);
    });

  if (loading) return <DentistasSkeleton />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-(--text-color)">
          {visaoGlobal ? "Todos os Dentistas" : "Dentistas Vinculados"}
          <span className="ml-2 text-xs font-normal text-(--text-secondary-color)">
            {rows.length}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary-color)" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar nome, CRO ou especialidade"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
          />
        </div>
        {especialidades.length > 1 && (
          <select
            value={filtroEsp}
            onChange={(e) => setFiltroEsp(e.target.value)}
            aria-label="Filtrar por especialidade"
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
          >
            <option value="todas">Todas especialidades</option>
            {especialidades.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        )}
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as OrdenacaoDentistas)}
          aria-label="Ordenar"
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
        >
          <option value="nome">Nome (A–Z)</option>
          <option value="atividade">Mais ativos</option>
          <option value="pacientes">Mais pacientes</option>
        </select>
      </div>

      {rows.length === 0 && (
        <p className="text-center text-(--text-secondary-color) py-10">
          Nenhum dentista vinculado.
        </p>
      )}

      {rows.length > 0 && visiveis.length === 0 && (
        <p className="text-center text-(--text-secondary-color) py-6 text-sm">
          Nenhum dentista bate com o filtro.
        </p>
      )}

      {visiveis.map((r) => (
        <DentistaCard
          key={r.dentista.id}
          stats={r}
          open={expandedId === r.dentista.id}
          onToggle={() =>
            setExpandedId(expandedId === r.dentista.id ? null : r.dentista.id)
          }
          responsavel={
            visaoGlobal && r.dentista.id_colaborador != null
              ? responsaveis.get(r.dentista.id_colaborador) ?? null
              : null
          }
          onNotificar={() => onIrPara("notificacoes", r.dentista.id)}
          onAnotar={() => onIrPara("anotacoes", r.dentista.id)}
        />
      ))}
    </div>
  );
}

function DentistasSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm p-4 flex items-center justify-between gap-3"
        >
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="w-4 h-4" rounded="full" />
        </div>
      ))}
    </div>
  );
}

function DentistaCard({
  stats, open, onToggle, responsavel, onNotificar, onAnotar,
}: {
  stats: DentistaStats;
  open: boolean;
  onToggle: () => void;
  responsavel: string | null;
  onNotificar: () => void;
  onAnotar: () => void;
}) {
  const { dentista: d, pacientes, realizados, agendados, proximos7d, examesPendentes } = stats;
  const temAlerta = examesPendentes > 0;
  const borderColor = temAlerta
    ? "border-l-amber-500"
    : "border-l-(--brand-primary)";

  return (
    <div
      className={`bg-white border border-gray-200 border-l-4 ${borderColor} rounded-xl shadow-sm overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-(--brand-secondary) truncate">
              {d.nome}
            </p>
            {proximos7d > 0 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 inline-flex items-center gap-1"
                title={`${proximos7d} agendado(s) nos próximos 7 dias`}
              >
                <Calendar className="w-3 h-3" /> {proximos7d} próx. 7d
              </span>
            )}
            {examesPendentes > 0 && (
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-flex items-center gap-1"
                title="Exames sem resultado"
              >
                <AlertCircle className="w-3 h-3" /> {examesPendentes} exame(s) pendente(s)
              </span>
            )}
          </div>
          <p className="text-xs text-(--text-secondary-color) mt-0.5 truncate">
            {d.especialidade} · CRO {d.cro}
          </p>
          {responsavel && (
            <p className="text-xs text-(--text-secondary-color) mt-0.5 truncate">
              Responsável: <span className="text-(--text-color)">{responsavel}</span>
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-(--brand-primary) shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-(--brand-primary) shrink-0" />
        )}
      </button>

      <div className="collapsible" data-open={open}>
        <div>
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Pacientes" value={pacientes} />
              <Stat label="Realizados" value={realizados} />
              <Stat label="Agendados" value={agendados} />
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                onClick={onNotificar}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-(--brand-primary) text-(--brand-primary) hover:bg-(--brand-tertiary)"
              >
                <Bell className="w-3.5 h-3.5" /> Enviar notificação
              </button>
              <button
                onClick={onAnotar}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-(--brand-primary) text-(--brand-primary) hover:bg-(--brand-tertiary)"
              >
                <FileText className="w-3.5 h-3.5" /> Ver anotações
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-(--brand-tertiary) rounded-lg p-3 text-center">
      <p className="text-xl font-bold text-(--brand-primary)">{value}</p>
      <p className="text-xs text-(--text-color) mt-0.5">{label}</p>
    </div>
  );
}

// ─── Notificações tab ───────────────────────────────────────────────────────

type SendNotifForm = { destinatario_id: string; mensagem: string };

function NotificacoesTab({
  colaboradorId,
  readOnly,
  initialDentistaId,
}: {
  colaboradorId: number;
  readOnly: boolean;
  initialDentistaId?: number | null;
}) {
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [enviadas, setEnviadas] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dts, ns] = await Promise.all([
        getDentistasByColaborador(colaboradorId),
        getNotificacoesEnviadasColaborador(colaboradorId),
      ]);
      setDentistas(dts);
      setEnviadas(ns);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [colaboradorId]);

  useEffect(() => {
    void load();
  }, [load]);

  const getDentistaNome = (id: number | null) =>
    id == null ? "—" : dentistas.find((d) => d.id === id)?.nome ?? `#${id}`;

  // Filtro de dentista destinatário nas enviadas.
  const [filtroEnviadas, setFiltroEnviadas] = useState<number | "todos">("todos");

  const enviadasFiltradas =
    filtroEnviadas === "todos"
      ? enviadas
      : enviadas.filter((n) => n.id_dentista === filtroEnviadas);

  const aguardando = enviadasFiltradas.filter((n) => n.data_leitura == null);
  const lidasEnviadas = enviadasFiltradas.filter((n) => n.data_leitura != null);

  // Dentistas que JÁ receberam alguma mensagem deste colaborador (só esses no filtro).
  const dentistasComEnviadas = (() => {
    const ids = new Set<number>();
    for (const n of enviadas) if (n.id_dentista != null) ids.add(n.id_dentista);
    return dentistas.filter((d) => ids.has(d.id));
  })();

  // Agrupa as enviadas filtradas por dentista, preservando ordem cronológica.
  function agruparPorDentista(ns: Notificacao[]) {
    const grupos = new Map<number, Notificacao[]>();
    for (const n of ns) {
      if (n.id_dentista == null) continue;
      const arr = grupos.get(n.id_dentista) ?? [];
      arr.push(n);
      grupos.set(n.id_dentista, arr);
    }
    return Array.from(grupos.entries()).map(([id, notifs]) => ({
      dentistaId: id,
      nome: getDentistaNome(id),
      notifs,
    }));
  }

  const aguardandoAgrupadas = agruparPorDentista(aguardando);
  const lidasAgrupadas = agruparPorDentista(lidasEnviadas);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SendNotifForm>({
    defaultValues: {
      destinatario_id: initialDentistaId ? String(initialDentistaId) : "",
      mensagem: "",
    },
  });

  // Quando o usuário chega via atalho, pré-seleciona o dentista no form.
  useEffect(() => {
    if (initialDentistaId) setValue("destinatario_id", String(initialDentistaId));
  }, [initialDentistaId, setValue]);

  const onSend = async (data: SendNotifForm) => {
    setSendError(null);
    setSent(false);
    try {
      await enviarColaboradorParaDentista({
        mensagem: data.mensagem,
        colaboradorId,
        dentistaId: Number(data.destinatario_id),
      });
      reset();
      setSent(true);
      const ns = await getNotificacoesEnviadasColaborador(colaboradorId);
      setEnviadas(ns);
    } catch (err) {
      setSendError(errorMessage(err));
    }
  };

  if (loading) return <NotificacoesSkeleton readOnly={readOnly} />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {!readOnly && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-(--brand-secondary) mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Enviar Notificação
          </h3>
          <form onSubmit={handleSubmit(onSend)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-(--text-color) mb-1">
              Dentista
            </label>
            <select
              {...register("destinatario_id", { required: true })}
              className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
            >
              <option value="">Selecione...</option>
              {dentistas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            {errors.destinatario_id && (
              <p className="text-xs text-red-600 mt-1">
                Selecione um dentista.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-color) mb-1">
              Mensagem
            </label>
            <textarea
              {...register("mensagem", { required: "Digite uma mensagem." })}
              rows={3}
              placeholder="Escreva sua mensagem..."
              className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none"
            />
            {errors.mensagem && (
              <p className="text-xs text-red-600 mt-1">
                {errors.mensagem.message}
              </p>
            )}
          </div>
          {sendError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              {sendError}
            </p>
          )}
          {sent && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
              Notificação enviada.
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
          </form>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h3 className="font-semibold text-(--text-color) flex items-center gap-2">
            <Bell className="w-4 h-4 text-(--brand-primary)" />
            Enviadas
          </h3>
          {dentistasComEnviadas.length > 1 && (
            <select
              value={filtroEnviadas}
              onChange={(e) =>
                setFiltroEnviadas(
                  e.target.value === "todos" ? "todos" : Number(e.target.value),
                )
              }
              aria-label="Filtrar enviadas por dentista"
              className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
            >
              <option value="todos">Todos os dentistas</option>
              {dentistasComEnviadas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {enviadas.length === 0 && (
          <p className="text-center text-(--text-secondary-color) py-8">
            Nenhuma notificação enviada ainda.
          </p>
        )}

        {enviadas.length > 0 && enviadasFiltradas.length === 0 && (
          <p className="text-center text-(--text-secondary-color) py-6 text-sm">
            Nenhuma mensagem enviada a este dentista.
          </p>
        )}

        <div className="space-y-6">
          {/* Aguardando leitura */}
          {aguardandoAgrupadas.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-amber-700 flex items-center gap-2">
                Aguardando leitura
                <span className="bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5">
                  {aguardando.length}
                </span>
              </h4>
              {aguardandoAgrupadas.map(({ dentistaId, nome, notifs }) => (
                <DentistaGrupo
                  key={dentistaId}
                  nome={nome}
                  notifs={notifs}
                  estado="aguardando"
                />
              ))}
            </div>
          )}

          {/* Lidas pelo dentista */}
          {lidasAgrupadas.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-(--text-secondary-color)">
                Lidas pelo dentista
              </h4>
              {lidasAgrupadas.map(({ dentistaId, nome, notifs }) => (
                <DentistaGrupo
                  key={dentistaId}
                  nome={nome}
                  notifs={notifs}
                  estado="lida"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificacoesSkeleton({ readOnly }: { readOnly: boolean }) {
  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <div className="space-y-2 border-l-2 border-(--brand-tertiary) pl-3">
                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <SkeletonText lines={2} />
                  <Skeleton className="h-2.5 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DentistaGrupo({
  nome,
  notifs,
  estado,
}: {
  nome: string;
  notifs: Notificacao[];
  estado: "aguardando" | "lida";
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-(--brand-secondary)">
        {nome}{" "}
        <span className="text-(--text-secondary-color) font-normal">
          · {notifs.length} mensagem{notifs.length === 1 ? "" : "s"}
        </span>
      </p>
      <div className="space-y-2 border-l-2 border-(--brand-tertiary) pl-3">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`bg-white border rounded-xl p-3 ${
              estado === "aguardando"
                ? "border-amber-200"
                : "border-gray-200 opacity-75"
            }`}
          >
            <p className="text-sm text-(--text-color) break-words">{n.mensagem}</p>
            <p
              className="text-xs text-(--text-secondary-color) mt-1"
              title={tempoExato(n.data_envio)}
            >
              Enviada {tempoRelativo(n.data_envio)}
              {n.data_leitura && (
                <> · Lida {tempoRelativo(n.data_leitura)}</>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Anotações tab ──────────────────────────────────────────────────────────

function AnotacoesSkeleton({ readOnly }: { readOnly: boolean }) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
      {!readOnly && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-9 w-24" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <SkeletonText lines={2} />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

type AddNoteForm = { texto: string };

function AnotacoesTab({
  colaboradorId,
  readOnly,
  initialDentistaId,
}: {
  colaboradorId: number;
  readOnly: boolean;
  initialDentistaId?: number | null;
}) {
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dts = await getDentistasByColaborador(colaboradorId);
      setDentistas(dts);
      // Honra o dentista pré-selecionado vindo de um atalho, se ele estiver na lista.
      const preselecionado = initialDentistaId != null
        && dts.some((d) => d.id === initialDentistaId)
        ? initialDentistaId
        : null;
      const inicial = preselecionado ?? dts[0]?.id ?? null;
      setSelectedId(inicial);
      setNotes(inicial != null ? await getAnotacoesSobre("dentista", inicial) : []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [colaboradorId, initialDentistaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddNoteForm>();

  const handleSelect = async (id: number) => {
    setSelectedId(id);
    setNotes([]);
    try {
      setNotes(await getAnotacoesSobre("dentista", id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const onAdd = async (data: AddNoteForm) => {
    if (selectedId == null) return;
    try {
      await saveAnotacao({
        texto: data.texto,
        data: new Date().toISOString().slice(0, 10),
        autor_id: colaboradorId,
        autor_tipo: "colaborador",
        sobre_tipo: "dentista",
        sobre_id: selectedId,
      });
      reset();
      setNotes(await getAnotacoesSobre("dentista", selectedId));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (loading) return <AnotacoesSkeleton readOnly={readOnly} />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <label className="block text-sm font-medium text-(--text-color) mb-1">
          Dentista
        </label>
        <select
          value={selectedId ?? ""}
          onChange={(e) => handleSelect(Number(e.target.value))}
          className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
        >
          <option value="">Selecione...</option>
          {dentistas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </div>

      {!readOnly && (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-(--brand-secondary) mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Anotação
        </h3>
        <form onSubmit={handleSubmit(onAdd)} className="space-y-3">
          <div>
            <textarea
              {...register("texto", { required: "Escreva uma anotação." })}
              rows={3}
              placeholder="Escreva sua anotação sobre este dentista..."
              disabled={selectedId == null}
              className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none disabled:opacity-60"
            />
            {errors.texto && (
              <p className="text-xs text-red-600 mt-1">
                {errors.texto.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={selectedId == null}
            className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
        </form>
      </div>
      )}

      <div className="space-y-2">
        {notes.length === 0 && (
          <p className="text-center text-(--text-secondary-color) py-8">
            Nenhuma anotação para este dentista.
          </p>
        )}
        {notes.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <p className="text-sm text-(--text-color)">{a.texto}</p>
            <p className="text-xs text-(--text-secondary-color) mt-2">
              {formatDate(a.data)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Gestão tab ─────────────────────────────────────────────────────────────

type GestaoSub =
  | "pacientes"
  | "campanhas"
  | "dentistas"
  | "colaboradores";

interface SubTabDef {
  key: GestaoSub;
  label: string;
  Icon: React.ElementType;
  /** Nível mínimo do cargo logado pra ver esta sub-aba. */
  minNivel: number;
  /** Texto da pílula de permissão (ex: "Auxiliar+", "Administrador"). */
  badge: string;
}

const SUB_TABS: SubTabDef[] = [
  { key: "pacientes",     label: "Pacientes",     Icon: UserCircle,   minNivel: 2, badge: "Auxiliar+" },
  { key: "campanhas",     label: "Campanhas",     Icon: Megaphone,    minNivel: 2, badge: "Auxiliar+" },
  { key: "dentistas",     label: "Dentistas",     Icon: Stethoscope,  minNivel: 2, badge: "Auxiliar+" },
  { key: "colaboradores", label: "Colaboradores", Icon: IdCard,       minNivel: 4, badge: "Administrador" },
];

function GestaoTab({ cargo }: { cargo: CargoColaborador }) {
  const visiveis = SUB_TABS.filter((s) => temNivel(cargo, s.minNivel));
  const [sub, setSub] = useState<GestaoSub | null>(visiveis[0]?.key ?? null);

  if (visiveis.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <Settings className="w-8 h-8 mx-auto text-(--text-secondary-color) mb-2" />
        <p className="text-sm text-(--text-secondary-color)">
          Você não tem acesso a nenhuma área de gestão.
        </p>
      </div>
    );
  }

  const ativa = visiveis.find((s) => s.key === sub) ?? visiveis[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {visiveis.map(({ key, label, Icon, badge }) => {
          const selected = ativa.key === key;
          return (
            <button
              key={key}
              onClick={() => setSub(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                selected
                  ? "bg-(--brand-primary) text-white border-(--brand-primary)"
                  : "bg-white text-(--text-color) border-gray-200 hover:border-(--brand-primary)"
              }`}
              title={`Requer cargo: ${badge}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      <GestaoSubContent sub={ativa} cargo={cargo} />
    </div>
  );
}

function GestaoSubContent({
  sub,
  cargo,
}: {
  sub: SubTabDef;
  cargo: CargoColaborador;
}) {
  if (sub.key === "pacientes") return <PacientesGestao />;
  if (sub.key === "campanhas") return <CampanhasGestao />;
  if (sub.key === "dentistas") return <DentistasGestao cargo={cargo} />;
  if (sub.key === "colaboradores") return <ColaboradoresGestao />;
  return <GestaoPlaceholder sub={sub} cargo={cargo} />;
}

function GestaoPlaceholder({
  sub,
  cargo,
}: {
  sub: SubTabDef;
  cargo: CargoColaborador;
}) {
  const { Icon, label, badge } = sub;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-(--brand-secondary) flex items-center gap-2">
          <Icon className="w-4 h-4" /> {label}
        </h3>
        <span className="text-[10px] bg-(--brand-tertiary) text-(--brand-secondary) rounded-full px-2 py-0.5 font-medium">
          {badge}
        </span>
      </div>
      <p className="text-sm text-(--text-secondary-color)">
        Em breve: gestão de {label.toLowerCase()} ({cargo}).
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Colaborador() {
  const { user } = useAuth();
  const colaboradorId = user!.id;
  const cargo = user!.cargo;
  const isEstagiario = cargo === "Estagiário";
  // Gestão é só pra quem realmente gere (Auxiliar+). Solicitações é pra todos.
  const podeGestao = temNivel(cargo, 2);
  const [tab, setTab] = useState<Tab>("dentistas");
  // Dentista pré-selecionado ao chegar via atalho de outra aba.
  const [dentistaContexto, setDentistaContexto] = useState<number | null>(null);

  const irParaAba = (destino: Tab, dentistaId?: number) => {
    setTab(destino);
    setDentistaContexto(dentistaId ?? null);
  };

  const tabsVisiveis = TABS.filter((t) => t.key !== "gestao" || podeGestao);
  const gridClass =
    tabsVisiveis.length === 7 ? "grid-cols-7"
    : tabsVisiveis.length === 6 ? "grid-cols-6"
    : tabsVisiveis.length === 5 ? "grid-cols-5"
    : tabsVisiveis.length === 4 ? "grid-cols-4"
    : "grid-cols-3";

  return (
    <div className="min-h-screen bg-(--brand-tertiary)">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div
          className={`grid ${gridClass} bg-white rounded-xl overflow-hidden border border-gray-200 mb-6`}
        >
          {tabsVisiveis.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => irParaAba(key)}
              className={`flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-(--brand-primary) text-white"
                  : "text-(--text-color) hover:bg-(--brand-tertiary)"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {tab === "dentistas" && (
          <DentistasTab
            colaboradorId={colaboradorId}
            visaoGlobal={cargo === "Administrador"}
            onIrPara={irParaAba}
          />
        )}
        {tab === "notificacoes" && (
          <NotificacoesTab
            colaboradorId={colaboradorId}
            readOnly={isEstagiario}
            initialDentistaId={dentistaContexto}
          />
        )}
        {tab === "anotacoes" && (
          <AnotacoesTab
            colaboradorId={colaboradorId}
            readOnly={isEstagiario}
            initialDentistaId={dentistaContexto}
          />
        )}
        {tab === "solicitacoes" && cargo && (
          <SolicitacoesGestao cargo={cargo} />
        )}
        {tab === "mapa" && <MapaTab />}
        {tab === "analise" && <AnaliseTab />}
        {tab === "gestao" && podeGestao && cargo && (
          <GestaoTab cargo={cargo} />
        )}
      </main>
    </div>
  );
}
