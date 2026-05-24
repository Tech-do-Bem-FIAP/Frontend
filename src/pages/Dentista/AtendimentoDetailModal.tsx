import { useEffect, useState, useCallback } from "react";
import {
  X,
  Loader2,
  CheckCheck,
  Plus,
  FileText,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  atualizarAtendimento,
  lancarResultadoExame,
  adicionarExameAoAtendimento,
  getAnotacoesSobre,
  saveAnotacao,
} from "../../data/api";
import { ApiError } from "../../api/client";
import type {
  Atendimento,
  Paciente,
  StatusAtendimento,
  Anotacao,
} from "../../types";

interface Props {
  atendimento: Atendimento;
  paciente: Paciente | null;
  dentistaId: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

const STATUS_COLORS: Record<StatusAtendimento, string> = {
  Agendado: "bg-blue-100 text-blue-700",
  Realizado: "bg-green-100 text-green-700",
  Cancelado: "bg-gray-100 text-gray-500",
};

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.status === 0 ? "Não foi possível conectar à API." : err.message;
  }
  return "Erro inesperado.";
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

function formatDataHoraLonga(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDataAnotacao(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function AtendimentoDetailModal({
  atendimento,
  paciente,
  dentistaId,
  onClose,
  onSaved,
}: Props) {

  const [status, setStatus] = useState<StatusAtendimento>(atendimento.status);
  const [observacoes, setObservacoes] = useState(atendimento.observacoes);

  const [dtAtendimento, setDtAtendimento] = useState(
    atendimento.dt_atendimento.slice(0, 16),
  );
  const [savingHeader, setSavingHeader] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const dirty =
    status !== atendimento.status ||
    observacoes !== atendimento.observacoes ||
    dtAtendimento !== atendimento.dt_atendimento.slice(0, 16);

  const persistirAlteracoes = useCallback(
    async (next: { status: StatusAtendimento; observacoes: string; data: string }) => {
      await atualizarAtendimento(
        {
          id: atendimento.id,
          tipo: atendimento.tipo,
          idPaciente: atendimento.id_paciente,
          idDentista: atendimento.id_dentista,
          idCampanha: atendimento.id_campanha,
        },
        {
          status: next.status,
          observacoes: next.observacoes,
          dt_atendimento: next.data,
        },
      );
      await onSaved();
    },
    [atendimento, onSaved],
  );

  const salvarHeader = async () => {
    setSavingHeader(true);
    setHeaderError(null);
    try {
      await persistirAlteracoes({ status, observacoes, data: dtAtendimento });
    } catch (err) {
      setHeaderError(errorMessage(err));
    } finally {
      setSavingHeader(false);
    }
  };

  const cancelarAtendimento = async () => {
    if (atendimento.status === "Cancelado") return;
    const ok = window.confirm(
      `Cancelar este atendimento? O paciente ${
        paciente?.nome ?? ""
      } será marcado como cancelado.`,
    );
    if (!ok) return;
    setSavingHeader(true);
    setHeaderError(null);
    try {
      setStatus("Cancelado");
      await persistirAlteracoes({
        status: "Cancelado",
        observacoes,
        data: dtAtendimento,
      });
    } catch (err) {
      setHeaderError(errorMessage(err));
    } finally {
      setSavingHeader(false);
    }
  };

  const [resultados, setResultados] = useState<Record<number, string>>({});
  const [savingExame, setSavingExame] = useState<number | null>(null);
  const [exameError, setExameError] = useState<string | null>(null);
  const [showAddExame, setShowAddExame] = useState(false);
  const [novoExameTipo, setNovoExameTipo] = useState("");
  const [novoExameRequisitos, setNovoExameRequisitos] = useState("");

  const salvarResultado = async (
    idExame: number,
    tipo: string,
    requisitos: string,
  ) => {
    const resultado = resultados[idExame] ?? "";
    if (!resultado.trim()) return;
    setSavingExame(idExame);
    setExameError(null);
    try {
      await lancarResultadoExame(idExame, tipo, requisitos, resultado, atendimento.id);
      await onSaved();
    } catch (err) {
      setExameError(errorMessage(err));
    } finally {
      setSavingExame(null);
    }
  };

  const adicionarExame = async () => {
    if (!novoExameTipo.trim()) return;
    setExameError(null);
    try {
      await adicionarExameAoAtendimento(
        atendimento.id,
        novoExameTipo,
        novoExameRequisitos,
      );
      setNovoExameTipo("");
      setNovoExameRequisitos("");
      setShowAddExame(false);
      await onSaved();
    } catch (err) {
      setExameError(errorMessage(err));
    }
  };

  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loadingAnot, setLoadingAnot] = useState(true);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [savingAnot, setSavingAnot] = useState(false);
  const [anotError, setAnotError] = useState<string | null>(null);

  const carregarAnotacoes = useCallback(async () => {
    setLoadingAnot(true);
    try {
      setAnotacoes(await getAnotacoesSobre("atendimento", atendimento.id));
    } catch (err) {
      setAnotError(errorMessage(err));
    } finally {
      setLoadingAnot(false);
    }
  }, [atendimento.id]);

  useEffect(() => {
    void carregarAnotacoes();
  }, [carregarAnotacoes]);

  const adicionarAnotacao = async () => {
    if (!novaAnotacao.trim()) return;
    setSavingAnot(true);
    setAnotError(null);
    try {
      await saveAnotacao({
        texto: novaAnotacao.trim(),
        data: new Date().toISOString().slice(0, 10),
        autor_id: dentistaId,
        autor_tipo: "dentista",
        sobre_tipo: "atendimento",
        sobre_id: atendimento.id,
      });
      setNovaAnotacao("");
      await carregarAnotacoes();
    } catch (err) {
      setAnotError(errorMessage(err));
    } finally {
      setSavingAnot(false);
    }
  };

  const idade = paciente ? calcIdade(paciente.data_nasc) : null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-(--brand-secondary) truncate">
              {paciente?.nome ?? `Paciente #${atendimento.id_paciente}`}
              {idade != null && (
                <span className="text-(--text-secondary-color) font-normal">
                  {" "}· {idade} anos
                </span>
              )}
            </h3>
            {paciente && (
              <p className="text-xs text-(--text-secondary-color) mt-0.5">
                {paciente.telefone}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-(--text-secondary-color) hover:text-(--text-color) shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {}
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm text-(--text-color)">
                <span className="font-medium">{atendimento.tipo}</span>
                <br />
                <span className="text-(--text-secondary-color) text-xs">
                  {formatDataHoraLonga(atendimento.dt_atendimento)}
                </span>
              </p>
              <span
                className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLORS[atendimento.status]}`}
              >
                {atendimento.status}
              </span>
            </div>
            <p className="text-xs text-(--text-secondary-color)">
              Campanha: {atendimento.nome_campanha || `#${atendimento.id_campanha}`}
            </p>
          </section>

          {}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-(--brand-secondary)">
              Status, data e observações
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-(--text-secondary-color) mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusAtendimento)}
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                >
                  <option>Agendado</option>
                  <option>Realizado</option>
                  <option>Cancelado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-(--text-secondary-color) mb-1">
                  Data e hora
                </label>
                <input
                  type="datetime-local"
                  value={dtAtendimento}
                  onChange={(e) => setDtAtendimento(e.target.value)}
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-(--text-secondary-color) mb-1">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none"
              />
            </div>
            {headerError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {headerError}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={salvarHeader}
                disabled={!dirty || savingHeader}
                className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {savingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                Salvar alterações
              </button>
              {atendimento.status !== "Cancelado" && (
                <button
                  type="button"
                  onClick={cancelarAtendimento}
                  disabled={savingHeader}
                  className="text-xs text-red-600 hover:text-red-700 font-medium underline-offset-2 hover:underline disabled:opacity-50"
                >
                  Cancelar atendimento
                </button>
              )}
            </div>
          </section>

          {}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-(--brand-secondary)">
                Exames
              </h4>
              <button
                type="button"
                onClick={() => setShowAddExame(true)}
                className="text-xs text-(--brand-primary) hover:text-(--brand-secondary) font-medium inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Adicionar
              </button>
            </div>

            {atendimento.exames.length === 0 && !showAddExame && (
              <p className="text-xs text-(--text-secondary-color)">
                Nenhum exame neste atendimento.
              </p>
            )}

            {atendimento.exames.map((e) => {
              const pendente = !e.resultado;
              const valorAtual = resultados[e.id] ?? "";
              return (
                <div
                  key={e.id}
                  className="bg-(--brand-tertiary) rounded-lg p-3 space-y-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-(--brand-secondary) break-words">
                      {e.tipo}
                    </p>
                    {e.requisitos && (
                      <p className="text-xs text-(--text-secondary-color) break-words">
                        {e.requisitos}
                      </p>
                    )}
                  </div>
                  {pendente ? (
                    <div className="space-y-2">
                      <textarea
                        value={valorAtual}
                        onChange={(ev) =>
                          setResultados((prev) => ({ ...prev, [e.id]: ev.target.value }))
                        }
                        rows={2}
                        placeholder="Lançar resultado..."
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => salvarResultado(e.id, e.tipo, e.requisitos)}
                        disabled={!valorAtual.trim() || savingExame === e.id}
                        className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {savingExame === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                        Salvar resultado
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-green-700 break-words">
                      ✓ {e.resultado}
                    </p>
                  )}
                </div>
              );
            })}

            {showAddExame && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <input
                  value={novoExameTipo}
                  onChange={(e) => setNovoExameTipo(e.target.value)}
                  placeholder="Tipo de exame (ex: Radiografia Periapical)"
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                />
                <input
                  value={novoExameRequisitos}
                  onChange={(e) => setNovoExameRequisitos(e.target.value)}
                  placeholder="Requisitos (opcional)"
                  className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={adicionarExame}
                    disabled={!novoExameTipo.trim()}
                    className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExame(false);
                      setNovoExameTipo("");
                      setNovoExameRequisitos("");
                    }}
                    className="bg-(--brand-tertiary) hover:bg-gray-200 text-(--text-color) px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {exameError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {exameError}
              </p>
            )}
          </section>

          {}
          <section className="space-y-3 border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-(--brand-secondary) flex items-center gap-2">
              <FileText className="w-4 h-4" /> Anotações deste atendimento
            </h4>

            {loadingAnot && (
              <p className="text-xs text-(--text-secondary-color) flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
              </p>
            )}

            {!loadingAnot && anotacoes.length === 0 && (
              <p className="text-xs text-(--text-secondary-color)">
                Sem anotações específicas deste atendimento.
              </p>
            )}

            {anotacoes.map((a) => (
              <div key={a.id} className="bg-(--brand-tertiary) rounded-lg p-3">
                <p className="text-sm text-(--text-color) whitespace-pre-wrap break-words">
                  {a.texto}
                </p>
                <p className="text-xs text-(--text-secondary-color) mt-1">
                  {formatDataAnotacao(a.data)}
                </p>
              </div>
            ))}

            <div className="space-y-2">
              <textarea
                value={novaAnotacao}
                onChange={(e) => setNovaAnotacao(e.target.value)}
                rows={2}
                placeholder="Nova anotação (pré-procedimento, intra-op, pós-op, etc.)..."
                className="w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) resize-none"
              />
              {anotError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {anotError}
                </p>
              )}
              <button
                type="button"
                onClick={adicionarAnotacao}
                disabled={!novaAnotacao.trim() || savingAnot}
                className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {savingAnot ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Salvar anotação
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
