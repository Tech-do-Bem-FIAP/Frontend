import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Users,
  CalendarDays,
  Bell,
  Plus,
  CheckCheck,
  AlertCircle,
  FileText,
  Send,
  CalendarPlus,
} from "lucide-react";
import { DashboardHeader } from "../../components/DashboardHeader/DashboardHeader";
import { Skeleton, SkeletonText } from "../../components/Skeleton/Skeleton";
import { AtendimentoDetailModal } from "./AtendimentoDetailModal";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPacientesByDentista,
  getAtendimentosByDentista,
  saveAtendimento,
  getNotificacoesRecebidasDentista,
  getNotificacoesEnviadasDentistaParaPacientes,
  enviarDentistaParaPaciente,
  marcarNotificacaoLida,
} from "../../data/api";
import { getAnotacoesSobre, saveAnotacao } from "../../data/api";
import { ApiError } from "../../api/client";
import { tempoRelativo, tempoExato } from "../../utils/tempo";
import type {
  Paciente,
  Atendimento,
  Notificacao,
  Anotacao,
  TipoAtendimento,
  StatusAtendimento,
} from "../../types";

type Tab = "pacientes" | "atendimentos" | "notificacoes";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function IconAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-full border border-(--brand-primary) text-(--brand-primary) hover:bg-(--brand-primary) hover:text-white transition-colors"
    >
      {icon}
    </button>
  );
}

function calcIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

function nextAppointment(
  atendimentos: Atendimento[],
  pacienteId: number,
): string | null {
  const hoje = new Date().toISOString();
  const upcoming = atendimentos
    .filter(
      (a) =>
        a.id_paciente === pacienteId &&
        a.status === "Agendado" &&
        a.dt_atendimento >= hoje,
    )
    .sort((a, b) => a.dt_atendimento.localeCompare(b.dt_atendimento));
  return upcoming[0]?.dt_atendimento ?? null;
}

function lastAppointment(
  atendimentos: Atendimento[],
  pacienteId: number,
): string | null {
  const hoje = new Date().toISOString();
  const past = atendimentos
    .filter(
      (a) =>
        a.id_paciente === pacienteId &&
        a.status === "Realizado" &&
        a.dt_atendimento < hoje,
    )
    .sort((a, b) => b.dt_atendimento.localeCompare(a.dt_atendimento));
  return past[0]?.dt_atendimento ?? null;
}

function hasExamesPendentes(
  atendimentos: Atendimento[],
  pacienteId: number,
): boolean {
  return atendimentos
    .filter((a) => a.id_paciente === pacienteId)
    .some((a) => a.exames.some((e) => !e.resultado));
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 0 ? "Não foi possível conectar à API." : err.message;
  }
  return "Erro inesperado.";
}

// ─── Shared UI ──────────────────────────────────────────────────────────────

function PacientesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm p-4 min-h-40 flex items-stretch justify-between gap-3"
        >
          <div className="flex-1 flex flex-col justify-center space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex flex-col justify-evenly shrink-0 gap-2">
            <Skeleton className="w-6 h-6" rounded="full" />
            <Skeleton className="w-6 h-6" rounded="full" />
            <Skeleton className="w-6 h-6" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AtendimentosSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" rounded="full" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-5 w-20" rounded="full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DentistaNotificacoesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
            <SkeletonText lines={2} />
            <Skeleton className="h-2.5 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
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

// ─── Tabs nav ────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "pacientes", label: "Pacientes", Icon: Users },
  { key: "atendimentos", label: "Atendimentos", Icon: CalendarDays },
  { key: "notificacoes", label: "Notificações", Icon: Bell },
];

// ─── Pacientes tab ──────────────────────────────────────────────────────────

type NotesModal = { paciente: Paciente } | null;

interface PacientesTabProps {
  dentistaId: number;
  onAtendimentoClick: (p: Paciente) => void;
  onNotificacaoClick: (p: Paciente) => void;
}

function PacientesTab({
  dentistaId,
  onAtendimentoClick,
  onNotificacaoClick,
}: PacientesTabProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pacs, ats] = await Promise.all([
        getPacientesByDentista(dentistaId),
        getAtendimentosByDentista(dentistaId),
      ]);
      setPacientes(pacs);
      setAtendimentos(ats);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dentistaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const [notesModal, setNotesModal] = useState<NotesModal>(null);
  const [notes, setNotes] = useState<Anotacao[]>([]);
  const [newNote, setNewNote] = useState("");

  const openNotes = async (p: Paciente) => {
    setNotesModal({ paciente: p });
    setNotes([]);
    setNewNote("");
    try {
      setNotes(await getAnotacoesSobre("paciente", p.id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !notesModal) return;
    try {
      await saveAnotacao({
        texto: newNote.trim(),
        data: new Date().toISOString().slice(0, 10),
        autor_id: dentistaId,
        autor_tipo: "dentista",
        sobre_tipo: "paciente",
        sobre_id: notesModal.paciente.id,
      });
      setNotes(await getAnotacoesSobre("paciente", notesModal.paciente.id));
      setNewNote("");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (loading) return <PacientesSkeleton />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <>
      <div className="space-y-3">
        <h2 className="font-semibold text-(--text-color)">Meus Pacientes</h2>

        {pacientes.length === 0 && (
          <p className="text-center text-(--text-secondary-color) py-10">
            Nenhum paciente vinculado.
          </p>
        )}

        {pacientes.map((p) => {
          const next = nextAppointment(atendimentos, p.id);
          const last = lastAppointment(atendimentos, p.id);
          const pending = hasExamesPendentes(atendimentos, p.id);
          const idade = calcIdade(p.data_nasc);

          return (
            <div
              key={p.id}
              className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm p-4 min-h-40 flex flex-col"
            >
              <div className="flex items-stretch justify-between gap-3 flex-1">
                <div className="flex-1 flex flex-col justify-center space-y-1">
                  <p className="font-semibold text-(--brand-secondary)">
                    {p.nome}
                    {idade != null && (
                      <span className="text-(--text-secondary-color) font-normal">
                        {" "}· {idade} anos
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-(--text-color)">
                    <span className="text-(--text-secondary-color)">Tel:</span>{" "}
                    {p.telefone}
                  </p>
                  <p className="text-sm text-(--text-color)">
                    <span className="text-(--text-secondary-color)">
                      Próximo atendimento:
                    </span>{" "}
                    {next ? (
                      formatDate(next)
                    ) : (
                      <span className="text-(--text-secondary-color)">—</span>
                    )}
                  </p>
                  <p className="text-sm text-(--text-color)">
                    <span className="text-(--text-secondary-color)">
                      Último atendimento:
                    </span>{" "}
                    {last ? (
                      formatDate(last)
                    ) : (
                      <span className="text-(--text-secondary-color)">—</span>
                    )}
                  </p>
                  {pending && (
                    <span className="self-start inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 mt-1">
                      <AlertCircle className="w-3 h-3" /> Exame pendente
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-evenly shrink-0">
                  <IconAction
                    label="Anotações"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={() => openNotes(p)}
                  />
                  <IconAction
                    label="Novo atendimento"
                    icon={<CalendarPlus className="w-4 h-4" />}
                    onClick={() => onAtendimentoClick(p)}
                  />
                  <IconAction
                    label="Enviar notificação"
                    icon={<Send className="w-4 h-4" />}
                    onClick={() => onNotificacaoClick(p)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-(--brand-secondary)">
                Anotações — {notesModal.paciente.nome}
              </h3>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-3">
              {notes.length === 0 && (
                <p className="text-sm text-(--text-secondary-color) text-center py-4">
                  Sem anotações.
                </p>
              )}
              {notes.map((a) => (
                <div
                  key={a.id}
                  className="bg-(--brand-tertiary) rounded-lg p-3"
                >
                  <p className="text-sm text-(--text-color)">{a.texto}</p>
                  <p className="text-xs text-(--text-secondary-color) mt-1">
                    {formatDate(a.data)}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100 space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                placeholder="Nova anotação..."
                className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNote}
                  className="flex-1 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setNotesModal(null)}
                  className="flex-1 bg-(--brand-tertiary) hover:bg-gray-200 text-(--text-color) py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Atendimentos tab ────────────────────────────────────────────────────────

type AtendimentoForm = {
  id_paciente: string;
  dt_atendimento: string;
  tipo: TipoAtendimento;
  status: StatusAtendimento;
  observacoes: string;
  addExame: boolean;
  exame_tipo: string;
  exame_requisitos: string;
};

interface AtendimentosTabProps {
  dentistaId: number;
  preselectedPaciente: Paciente | null;
  onConsumePreselect: () => void;
}

function AtendimentosTab({
  dentistaId,
  preselectedPaciente,
  onConsumePreselect,
}: AtendimentosTabProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusAtendimento | "Todos">("Todos");
  const [detailOpen, setDetailOpen] = useState<Atendimento | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pacs, ats] = await Promise.all([
        getPacientesByDentista(dentistaId),
        getAtendimentosByDentista(dentistaId),
      ]);
      setPacientes(pacs);
      setAtendimentos(ats);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dentistaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AtendimentoForm>({ defaultValues: { addExame: false } });

  const addExame = watch("addExame");

  const preselectedId = preselectedPaciente?.id ?? null;
  useEffect(() => {
    if (preselectedId == null) return;
    setSubmitError(null);
    reset({
      id_paciente: String(preselectedId),
      addExame: false,
      dt_atendimento: "",
      observacoes: "",
      exame_tipo: "",
      exame_requisitos: "",
    });
    setShowForm(true);
    onConsumePreselect();
  }, [preselectedId, reset, onConsumePreselect]);

  const onSubmit = async (data: AtendimentoForm) => {
    setSubmitError(null);
    try {
      await saveAtendimento(
        {
          id_paciente: Number(data.id_paciente),
          dt_atendimento: data.dt_atendimento,
          tipo: data.tipo,
          status: data.status,
          observacoes: data.observacoes,
          addExame: data.addExame,
          exame_tipo: data.exame_tipo,
          exame_requisitos: data.exame_requisitos,
        },
        dentistaId,
      );
      const ats = await getAtendimentosByDentista(dentistaId);
      setAtendimentos(ats);
      reset();
      setShowForm(false);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "SEM_CAMPANHA"
          ? "Nenhuma campanha cadastrada — não é possível registrar atendimentos."
          : errorMessage(err);
      setSubmitError(msg);
    }
  };

  const filtered =
    filter === "Todos"
      ? atendimentos
      : atendimentos.filter((a) => a.status === filter);

  const sorted = [...filtered].sort((a, b) =>
    b.dt_atendimento.localeCompare(a.dt_atendimento),
  );

  const getPacienteNome = (id: number) =>
    pacientes.find((p) => p.id === id)?.nome ?? `#${id}`;

  const STATUS_COLORS: Record<StatusAtendimento, string> = {
    Agendado: "bg-blue-100 text-blue-700",
    Realizado: "bg-green-100 text-green-700",
    Cancelado: "bg-gray-100 text-gray-500",
  };

  if (loading) return <AtendimentosSkeleton />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-(--text-color)">Atendimentos</h2>
        <button
          onClick={() => {
            setSubmitError(null);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      <div className="flex gap-2">
        {(["Todos", "Agendado", "Realizado", "Cancelado"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === s
                ? "bg-(--brand-primary) text-white"
                : "bg-white border border-gray-200 text-(--text-color) hover:bg-(--brand-tertiary)"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-(--text-secondary-color) py-10">
          Nenhum atendimento encontrado.
        </p>
      )}

      {sorted.map((a) => (
        <button
          type="button"
          key={a.id}
          onClick={() => setDetailOpen(a)}
          className="w-full text-left bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm p-4 space-y-2 hover:bg-(--brand-tertiary)/30 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-(--brand-secondary)">
                {getPacienteNome(a.id_paciente)}
              </p>
              <p className="text-sm text-(--text-color)">
                {a.tipo} · {formatDateTime(a.dt_atendimento)}
              </p>
            </div>
            <span
              className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLORS[a.status]}`}
            >
              {a.status}
            </span>
          </div>
          {a.observacoes && (
            <p className="text-sm text-(--text-color) border-t border-gray-100 pt-2">
              {a.observacoes}
            </p>
          )}
          {a.exames.length > 0 && (
            <div className="border-t border-gray-100 pt-2 space-y-2">
              {a.exames.map((e, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <p className="font-medium text-(--brand-secondary) break-words">
                    {e.tipo}
                  </p>
                  {e.requisitos && (
                    <p className="text-(--text-secondary-color) break-words">
                      {e.requisitos}
                    </p>
                  )}
                  {e.resultado ? (
                    <p className="text-green-600 break-words">✓ {e.resultado}</p>
                  ) : (
                    <p className="text-amber-600">Pendente</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </button>
      ))}

      {detailOpen && (
        <AtendimentoDetailModal
          atendimento={detailOpen}
          paciente={pacientes.find((p) => p.id === detailOpen.id_paciente) ?? null}
          dentistaId={dentistaId}
          onClose={() => setDetailOpen(null)}
          onSaved={async () => {
            const ats = await getAtendimentosByDentista(dentistaId);
            setAtendimentos(ats);
            const refreshed = ats.find((x) => x.id === detailOpen.id);
            setDetailOpen(refreshed ?? null);
          }}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-(--brand-secondary)">
                Registrar Atendimento
              </h3>
            </div>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="overflow-y-auto flex-1 p-5 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-(--text-color) mb-1">
                  Paciente
                </label>
                <select
                  {...register("id_paciente", {
                    required: "Selecione um paciente.",
                  })}
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                >
                  <option value="">Selecione...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                {errors.id_paciente && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.id_paciente.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text-color) mb-1">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  {...register("dt_atendimento", {
                    required: "Informe a data.",
                  })}
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                />
                {errors.dt_atendimento && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.dt_atendimento.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-(--text-color) mb-1">
                    Tipo
                  </label>
                  <select
                    {...register("tipo")}
                    className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                  >
                    <option>Consulta</option>
                    <option>Retorno</option>
                    <option>Emergência</option>
                    <option>Procedimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--text-color) mb-1">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                  >
                    <option>Agendado</option>
                    <option>Realizado</option>
                    <option>Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-(--text-color) mb-1">
                  Observações
                </label>
                <textarea
                  {...register("observacoes")}
                  rows={2}
                  placeholder="Observações clínicas (opcional)"
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("addExame")}
                    className="accent-(--brand-primary) w-4 h-4"
                  />
                  <span className="text-sm font-medium text-(--text-color)">
                    Solicitar exame
                  </span>
                </label>
              </div>

              {addExame && (
                <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-(--brand-tertiary)">
                  <div>
                    <label className="block text-sm font-medium text-(--text-color) mb-1">
                      Tipo de Exame
                    </label>
                    <input
                      {...register("exame_tipo")}
                      placeholder="Ex: Radiografia Periapical"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-(--text-color) mb-1">
                      Requisitos
                    </label>
                    <input
                      {...register("exame_requisitos")}
                      placeholder="Ex: Em jejum de 8 horas"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                    />
                  </div>
                </div>
              )}

              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {submitError}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setSubmitError(null);
                    setShowForm(false);
                  }}
                  className="flex-1 bg-(--brand-tertiary) hover:bg-gray-200 text-(--text-color) py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notificações tab ────────────────────────────────────────────────────────

type SendNotifForm = { id_paciente: string; mensagem: string };

interface NotificacoesTabProps {
  dentistaId: number;
  preselectedPaciente: Paciente | null;
  onConsumePreselect: () => void;
  recebidas: Notificacao[];
  onRefreshRecebidas: () => Promise<void>;
}

function NotificacoesTab({
  dentistaId,
  preselectedPaciente,
  onConsumePreselect,
  recebidas,
  onRefreshRecebidas,
}: NotificacoesTabProps) {
  const [enviadas, setEnviadas] = useState<Notificacao[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [env, pacs] = await Promise.all([
        getNotificacoesEnviadasDentistaParaPacientes(dentistaId),
        getPacientesByDentista(dentistaId),
      ]);
      setEnviadas(env);
      setPacientes(pacs);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dentistaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SendNotifForm>();

  const preselectedId = preselectedPaciente?.id ?? null;
  useEffect(() => {
    if (preselectedId == null) return;
    setValue("id_paciente", String(preselectedId));
    setSendError(null);
    setSent(false);
    onConsumePreselect();
  }, [preselectedId, setValue, onConsumePreselect]);

  const naoLidas = recebidas.filter((n) => n.data_leitura == null);
  const lidas = recebidas.filter((n) => n.data_leitura != null);
  const getPacienteNome = (id: number | null) =>
    id == null ? "—" : pacientes.find((p) => p.id === id)?.nome ?? `#${id}`;

  // Filtro de paciente nas enviadas. "todos" preserva o agrupamento.
  const [filtroEnviadas, setFiltroEnviadas] = useState<number | "todos">("todos");

  const enviadasFiltradas =
    filtroEnviadas === "todos"
      ? enviadas
      : enviadas.filter((n) => n.id_paciente === filtroEnviadas);

  // Agrupa enviadas (já filtradas) por paciente, preservando ordem cronológica.
  const enviadasPorPaciente = (() => {
    const grupos = new Map<number, Notificacao[]>();
    for (const n of enviadasFiltradas) {
      if (n.id_paciente == null) continue;
      const arr = grupos.get(n.id_paciente) ?? [];
      arr.push(n);
      grupos.set(n.id_paciente, arr);
    }
    return Array.from(grupos.entries()).map(([id, notifs]) => ({
      pacienteId: id,
      nome: getPacienteNome(id),
      notifs,
    }));
  })();

  // Pacientes que JÁ receberam alguma notificação — só faz sentido filtrar por esses.
  const pacientesComEnviadas = (() => {
    const ids = new Set<number>();
    for (const n of enviadas) if (n.id_paciente != null) ids.add(n.id_paciente);
    return pacientes.filter((p) => ids.has(p.id));
  })();

  const onSend = async (data: SendNotifForm) => {
    setSendError(null);
    setSent(false);
    try {
      await enviarDentistaParaPaciente({
        mensagem: data.mensagem,
        dentistaId,
        pacienteId: Number(data.id_paciente),
      });
      reset();
      setSent(true);
      const env = await getNotificacoesEnviadasDentistaParaPacientes(dentistaId);
      setEnviadas(env);
    } catch (err) {
      setSendError(errorMessage(err));
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await marcarNotificacaoLida(id);
      await onRefreshRecebidas();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (loading) return <DentistaNotificacoesSkeleton />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-(--brand-secondary) mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Enviar Notificação a Paciente
        </h3>
        {pacientes.length === 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
            Você ainda não tem pacientes vinculados.
          </p>
        )}
        <form onSubmit={handleSubmit(onSend)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-(--text-color) mb-1">
              Paciente
            </label>
            <select
              {...register("id_paciente", { required: "Selecione um paciente." })}
              disabled={pacientes.length === 0}
              className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) disabled:opacity-60"
            >
              <option value="">Selecione...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            {errors.id_paciente && (
              <p className="text-xs text-red-600 mt-1">
                {errors.id_paciente.message}
              </p>
            )}
          </div>
          <div>
            <textarea
              {...register("mensagem", { required: "Digite uma mensagem." })}
              rows={3}
              placeholder="Escreva sua mensagem para o paciente..."
              disabled={pacientes.length === 0}
              className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none disabled:opacity-60"
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
            disabled={isSubmitting || pacientes.length === 0}
            className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {/* Não lidas */}
        {naoLidas.length > 0 && (
          <div>
            <h3 className="font-semibold text-(--text-color) mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-(--brand-primary)" />
              Não lidas
              <span className="bg-(--brand-primary) text-white text-xs rounded-full px-2 py-0.5">
                {naoLidas.length}
              </span>
            </h3>
            <div className="space-y-2">
              {naoLidas.map((n) => (
                <NotifRecebidaCard
                  key={n.id}
                  notif={n}
                  onMarkRead={() => handleMarkRead(n.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lidas */}
        {lidas.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-(--text-secondary-color) mb-2">
              Lidas
            </h3>
            <div className="space-y-2">
              {lidas.map((n) => (
                <NotifRecebidaCard key={n.id} notif={n} />
              ))}
            </div>
          </div>
        )}

        {recebidas.length === 0 && (
          <p className="text-center text-(--text-secondary-color) py-8">
            Nenhuma notificação recebida.
          </p>
        )}
      </div>

      {enviadas.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="font-semibold text-(--text-color) flex items-center gap-2">
              <Bell className="w-4 h-4 text-(--brand-primary)" />
              Enviadas a Pacientes
            </h3>
            {pacientesComEnviadas.length > 1 && (
              <select
                value={filtroEnviadas}
                onChange={(e) =>
                  setFiltroEnviadas(
                    e.target.value === "todos" ? "todos" : Number(e.target.value),
                  )
                }
                aria-label="Filtrar enviadas por paciente"
                className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
              >
                <option value="todos">Todos os pacientes</option>
                {pacientesComEnviadas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
          {enviadasPorPaciente.length === 0 && (
            <p className="text-center text-(--text-secondary-color) py-6 text-sm">
              Nenhuma mensagem enviada a este paciente.
            </p>
          )}
          <div className="space-y-4">
            {enviadasPorPaciente.map(({ pacienteId, nome, notifs }) => (
              <div key={pacienteId} className="space-y-2">
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
                      className="bg-white border border-gray-200 rounded-xl p-3"
                    >
                      <p className="text-sm text-(--text-color)">{n.mensagem}</p>
                      <p
                        className="text-xs text-(--text-secondary-color) mt-1"
                        title={tempoExato(n.data_envio)}
                      >
                        {tempoRelativo(n.data_envio)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRecebidaCard({
  notif,
  onMarkRead,
}: {
  notif: Notificacao;
  onMarkRead?: () => void;
}) {
  const lida = notif.data_leitura != null;
  return (
    <div
      className={`bg-white border rounded-xl p-4 flex gap-3 items-start ${
        lida ? "border-gray-200 opacity-75" : "border-(--brand-primary) border-l-4"
      }`}
    >
      <div className="flex-1 min-w-0">
        {notif.nome_colaborador && (
          <p className="text-xs text-(--brand-secondary) font-medium mb-0.5">
            {notif.nome_colaborador}
          </p>
        )}
        <p
          className={`text-sm break-words ${lida ? "text-(--text-color)" : "font-semibold text-(--text-color)"}`}
        >
          {notif.mensagem}
        </p>
        <p
          className="text-xs text-(--text-secondary-color) mt-1"
          title={tempoExato(notif.data_envio)}
        >
          {tempoRelativo(notif.data_envio)}
        </p>
      </div>
      {!lida && onMarkRead && (
        <button
          onClick={onMarkRead}
          title="Marcar como lida"
          className="text-(--brand-primary) hover:text-(--brand-secondary) shrink-0 mt-0.5"
        >
          <CheckCheck className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Dentista() {
  const { user } = useAuth();
  const dentistaId = user!.id;
  const [tab, setTab] = useState<Tab>("pacientes");

  // Pré-seleção de paciente quando o dentista usa um atalho do card.
  const [preAtendimento, setPreAtendimento] = useState<Paciente | null>(null);
  const [preNotificacao, setPreNotificacao] = useState<Paciente | null>(null);

  const abrirAtendimentoPara = useCallback((p: Paciente) => {
    setPreAtendimento(p);
    setTab("atendimentos");
  }, []);

  const abrirNotificacaoPara = useCallback((p: Paciente) => {
    setPreNotificacao(p);
    setTab("notificacoes");
  }, []);

  const consumePreAtendimento = useCallback(() => setPreAtendimento(null), []);
  const consumePreNotificacao = useCallback(() => setPreNotificacao(null), []);

  // Recebidas vivem na Page pra alimentar o badge da tab Notificações.
  const [recebidas, setRecebidas] = useState<Notificacao[]>([]);
  const refreshRecebidas = useCallback(async () => {
    try {
      setRecebidas(await getNotificacoesRecebidasDentista(dentistaId));
    } catch {
      /* silencioso — a tab Notificações exibe o erro quando aberta */
    }
  }, [dentistaId]);
  useEffect(() => {
    void refreshRecebidas();
  }, [refreshRecebidas]);

  const naoLidasCount = recebidas.filter((n) => n.data_leitura == null).length;

  return (
    <div className="min-h-screen bg-(--brand-tertiary)">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 bg-white rounded-xl overflow-hidden border border-gray-200 mb-6">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-(--brand-primary) text-white"
                  : "text-(--text-color) hover:bg-(--brand-tertiary)"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {key === "notificacoes" && naoLidasCount > 0 && (
                <span
                  className={`absolute top-1.5 right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    tab === key
                      ? "bg-white text-(--brand-primary)"
                      : "bg-(--brand-primary) text-white"
                  }`}
                >
                  {naoLidasCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "pacientes" && (
          <PacientesTab
            dentistaId={dentistaId}
            onAtendimentoClick={abrirAtendimentoPara}
            onNotificacaoClick={abrirNotificacaoPara}
          />
        )}
        {tab === "atendimentos" && (
          <AtendimentosTab
            dentistaId={dentistaId}
            preselectedPaciente={preAtendimento}
            onConsumePreselect={consumePreAtendimento}
          />
        )}
        {tab === "notificacoes" && (
          <NotificacoesTab
            dentistaId={dentistaId}
            preselectedPaciente={preNotificacao}
            onConsumePreselect={consumePreNotificacao}
            recebidas={recebidas}
            onRefreshRecebidas={refreshRecebidas}
          />
        )}
      </main>
    </div>
  );
}
