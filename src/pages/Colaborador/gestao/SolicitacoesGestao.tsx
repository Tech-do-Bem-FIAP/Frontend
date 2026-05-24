import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Plus, X, Check, Ban, Trash2, AlertCircle, CheckCircle2, Clock,
  UserPlus, Mail, Phone, Eye, EyeOff, IdCard,
} from "lucide-react";
import { Skeleton } from "../../../components/Skeleton/Skeleton";
import {
  getTodasSolicitacoes,
  criarSolicitacao,
  aprovarSolicitacao,
  rejeitarSolicitacao,
  excluirSolicitacao,
} from "../../../data/api";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../../contexts/AuthContext";
import { temNivel } from "../../../types";
import { tempoRelativo, tempoExato } from "../../../utils/tempo";
import type { Solicitacao, CargoColaborador, StatusSolicitacao } from "../../../types";

const TIPOS_SOLICITACAO: { value: string; label: string }[] = [
  { value: "cadastro_paciente",     label: "Cadastrar paciente" },
  { value: "cadastro_dentista",     label: "Cadastrar dentista" },
  { value: "cadastro_campanha",     label: "Cadastrar campanha" },
  { value: "alteracao_dados",       label: "Alteração de dados" },
  { value: "outros",                label: "Outros" },
];

const TIPO_LABEL_EXTRA: Record<string, string> = {
  cadastro_externo: "Pedido de cadastro (externo)",
};

interface FormValues { tipo: string; descricao: string }

function errMsg(e: unknown) {
  if (e instanceof ApiError) return e.status === 0 ? "Sem conexão com a API." : e.message;
  return "Erro inesperado.";
}

function statusBadge(status: StatusSolicitacao) {
  if (status === "pendente")  return { cls: "bg-amber-100 text-amber-700",  Icon: Clock,         label: "Pendente" };
  if (status === "aprovada")  return { cls: "bg-green-100 text-green-700",  Icon: CheckCircle2,  label: "Aprovada" };
  return                            { cls: "bg-red-100 text-red-700",      Icon: Ban,           label: "Rejeitada" };
}

function tipoLabel(tipo: string): string {
  return (
    TIPOS_SOLICITACAO.find((t) => t.value === tipo)?.label
    ?? TIPO_LABEL_EXTRA[tipo]
    ?? tipo
  );
}

export function SolicitacoesGestao({ cargo }: { cargo: CargoColaborador }) {
  const { user } = useAuth();
  const meuId = user!.id;
  const podeRevisar = temNivel(cargo, 3);

  const [items, setItems] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | "todas">("todas");
  const [revisando, setRevisando] = useState<{ s: Solicitacao; acao: "aprovar" | "rejeitar" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setItems(await getTodasSolicitacoes());
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const escopo = podeRevisar ? items : items.filter((s) => s.id_solicitante === meuId);
  const visiveis = filtroStatus === "todas" ? escopo : escopo.filter((s) => s.status === filtroStatus);

  const pendentes  = visiveis.filter((s) => s.status === "pendente");
  const revisadas  = visiveis.filter((s) => s.status !== "pendente");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusSolicitacao | "todas")}
          aria-label="Filtrar por status"
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
        >
          <option value="todas">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="aprovada">Aprovadas</option>
          <option value="rejeitada">Rejeitadas</option>
        </select>

        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova solicitação
        </button>
      </div>

      {!podeRevisar && (
        <p className="text-xs text-(--text-secondary-color) bg-(--brand-tertiary) border border-(--brand-primary)/20 rounded-lg px-3 py-2">
          Você vê apenas suas próprias solicitações. A revisão é feita por Coordenadores e Administradores.
        </p>
      )}

      {creating && (
        <NovaSolicitacaoForm
          colaboradorId={meuId}
          onClose={() => setCreating(false)}
          onSaved={async () => { setCreating(false); await load(); }}
        />
      )}

      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
            </div>
          </div>
        ))}

      {!loading && err && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-2">
          <p className="text-sm text-red-700">{err}</p>
          <button onClick={load} className="text-xs text-(--brand-primary) font-medium">
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !err && visiveis.length === 0 && (
        <p className="text-center text-(--text-secondary-color) py-8 text-sm">
          Nenhuma solicitação{filtroStatus !== "todas" ? ` ${filtroStatus}` : ""}.
        </p>
      )}

      {!loading && !err && pendentes.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-amber-700 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendentes
            <span className="bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5">
              {pendentes.length}
            </span>
          </h4>
          {pendentes.map((s) => (
            <SolicitacaoCard
              key={s.id}
              s={s}
              meuId={meuId}
              podeRevisar={podeRevisar}
              onAprovar={() => setRevisando({ s, acao: "aprovar" })}
              onRejeitar={() => setRevisando({ s, acao: "rejeitar" })}
              onCancelar={async () => {
                try {
                  await excluirSolicitacao(s.id);
                  await load();
                } catch (e) {
                  setErr(errMsg(e));
                }
              }}
            />
          ))}
        </section>
      )}

      {!loading && !err && revisadas.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-sm font-medium text-(--text-secondary-color)">Revisadas</h4>
          {revisadas.map((s) => (
            <SolicitacaoCard
              key={s.id}
              s={s}
              meuId={meuId}
              podeRevisar={podeRevisar}
            />
          ))}
        </section>
      )}

      {revisando && (
        <RevisaoModal
          solicitacao={revisando.s}
          acao={revisando.acao}
          revisorId={meuId}
          onCancel={() => setRevisando(null)}
          onDone={async () => { setRevisando(null); await load(); }}
        />
      )}
    </div>
  );
}

function SolicitacaoCard({
  s, meuId, podeRevisar, onAprovar, onRejeitar, onCancelar,
}: {
  s: Solicitacao;
  meuId: number;
  podeRevisar: boolean;
  onAprovar?: () => void;
  onRejeitar?: () => void;
  onCancelar?: () => void;
}) {
  const b = statusBadge(s.status);
  const ehMinha = s.id_solicitante === meuId;
  const ehExterna = s.id_solicitante == null;
  const nomeAutor = ehExterna ? s.nome_externo ?? "—" : s.nome_solicitante ?? "—";

  return (
    <div
      className={`bg-white border border-gray-200 border-l-4 rounded-xl p-4 space-y-2 animate-fade-in ${
        ehExterna ? "border-l-purple-500" : "border-l-(--brand-primary)"
      }`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-(--brand-secondary)">{tipoLabel(s.tipo)}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${b.cls}`}>
              <b.Icon className="w-3 h-3" /> {b.label}
            </span>
            {ehExterna && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 inline-flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Externo
              </span>
            )}
            {ehMinha && (
              <span className="text-[10px] bg-(--brand-tertiary) text-(--brand-secondary) rounded-full px-2 py-0.5 font-medium">
                Sua
              </span>
            )}
          </div>
          <p
            className="text-xs text-(--text-secondary-color) mt-0.5"
            title={tempoExato(s.data_solicitacao)}
          >
            {nomeAutor} · {tempoRelativo(s.data_solicitacao)}
          </p>
        </div>
      </div>

      <p className="text-sm text-(--text-color) whitespace-pre-wrap break-words">
        {s.descricao}
      </p>

      {ehExterna && podeRevisar && <DadosExternos s={s} />}

      {s.status !== "pendente" && (
        <div className="bg-(--brand-tertiary) rounded-lg p-2 space-y-1">
          <p
            className="text-xs text-(--text-secondary-color)"
            title={s.data_revisao ? tempoExato(s.data_revisao) : ""}
          >
            Revisado por{" "}
            <span className="text-(--text-color) font-medium">
              {s.nome_revisor ?? "—"}
            </span>
            {s.data_revisao && <> · {tempoRelativo(s.data_revisao)}</>}
          </p>
          {s.comentario_revisao && (
            <p className="text-sm text-(--text-color) flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-(--text-secondary-color) shrink-0" />
              {s.comentario_revisao}
            </p>
          )}
        </div>
      )}

      {s.status === "pendente" && (
        <div className="flex items-center justify-end gap-2 pt-1">
          {podeRevisar && onAprovar && (
            <button
              onClick={onAprovar}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Check className="w-3.5 h-3.5" /> Aprovar
            </button>
          )}
          {podeRevisar && onRejeitar && (
            <button
              onClick={onRejeitar}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Ban className="w-3.5 h-3.5" /> Rejeitar
            </button>
          )}
          {ehMinha && onCancelar && (
            <button
              onClick={onCancelar}
              title="Cancelar (exclui a solicitação)"
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-(--text-color) px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DadosExternos({ s }: { s: Solicitacao }) {
  const [verSenha, setVerSenha] = useState(false);
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1.5 text-sm">
      <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
        Dados para cadastro
      </p>
      {s.cpf_externo && (
        <p className="text-(--text-color) flex items-center gap-1.5">
          <IdCard className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          CPF {s.cpf_externo}
        </p>
      )}
      <p className="text-(--text-color) flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span className="break-all">{s.email_externo}</span>
      </p>
      {s.telefone_externo && (
        <p className="text-(--text-color) flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          {s.telefone_externo}
        </p>
      )}
      {s.senha_externo && (
        <div className="flex items-center gap-2">
          <p className="text-(--text-color) flex-1">
            <span className="text-xs text-(--text-secondary-color) mr-1">Senha:</span>
            <span className="font-mono">
              {verSenha ? s.senha_externo : "•".repeat(s.senha_externo.length)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setVerSenha((v) => !v)}
            className="text-purple-700 hover:text-purple-900 text-xs flex items-center gap-1"
          >
            {verSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {verSenha ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      )}
    </div>
  );
}

function NovaSolicitacaoForm({
  colaboradorId, onClose, onSaved,
}: {
  colaboradorId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { tipo: TIPOS_SOLICITACAO[0].value, descricao: "" },
  });

  const onSubmit = async (v: FormValues) => {
    setSubmitErr(null);
    try {
      await criarSolicitacao({
        idSolicitante: colaboradorId,
        tipo: v.tipo,
        descricao: v.descricao.trim(),
      });
      onSaved();
    } catch (e) {
      setSubmitErr(errMsg(e));
    }
  };

  return (
    <div className="bg-white border-2 border-(--brand-primary) rounded-xl shadow-md p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-(--brand-secondary)">Nova solicitação</h3>
        <button onClick={onClose} title="Fechar" className="text-(--text-secondary-color) hover:text-(--text-color)">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-(--text-color) mb-1">Tipo</label>
          <select {...register("tipo", { required: true })} className={inputCls}>
            {TIPOS_SOLICITACAO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-(--text-color) mb-1">Descrição</label>
          <textarea
            {...register("descricao", { required: "Descreva sua solicitação" })}
            rows={4}
            placeholder="Explique o que precisa ser feito..."
            className={inputCls + " resize-none"}
          />
          {errors.descricao && (
            <p className="text-xs text-red-600 mt-1">{errors.descricao.message}</p>
          )}
        </div>

        {submitErr && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {submitErr}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RevisaoModal({
  solicitacao, acao, revisorId, onCancel, onDone,
}: {
  solicitacao: Solicitacao;
  acao: "aprovar" | "rejeitar";
  revisorId: number;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [comentario, setComentario] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ehExterna = solicitacao.id_solicitante == null;
  const exigeCargo = acao === "aprovar" && ehExterna;
  const [cargo, setCargo] = useState<CargoColaborador>("Auxiliar");

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      if (acao === "aprovar") {
        await aprovarSolicitacao(
          solicitacao.id,
          revisorId,
          comentario.trim() || null,
          exigeCargo ? cargo : null,
        );
      } else {
        await rejeitarSolicitacao(solicitacao.id, revisorId, comentario.trim() || null);
      }
      onDone();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };

  const btnCls =
    acao === "aprovar"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-red-600 hover:bg-red-700";
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3">
        <h3 className="font-semibold text-(--brand-secondary)">
          {acao === "aprovar" ? "Aprovar" : "Rejeitar"} solicitação
        </h3>
        <p className="text-sm text-(--text-secondary-color)">
          <span className="font-medium text-(--text-color)">{tipoLabel(solicitacao.tipo)}</span> · {solicitacao.nome_solicitante ?? solicitacao.nome_externo}
        </p>
        <p className="text-sm text-(--text-color) bg-(--brand-tertiary) rounded-lg p-3 whitespace-pre-wrap break-words">
          {solicitacao.descricao}
        </p>

        {exigeCargo && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
            <p className="text-xs text-purple-700">
              Ao aprovar, um colaborador será criado com os dados informados.
              Defina o cargo:
            </p>
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value as CargoColaborador)}
              className={inputCls}
            >
              <option value="Estagiário">Estagiário (apenas leitura)</option>
              <option value="Auxiliar">Auxiliar (CRUD pacientes/campanhas, edita dentista)</option>
              <option value="Coordenador">Coordenador (revisa solicitações)</option>
              <option value="Administrador">Administrador (acesso total)</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-(--text-color) mb-1">
            Comentário (opcional)
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
            placeholder={acao === "aprovar" ? "Ex: bem-vindo à equipe." : "Ex: faltou justificativa."}
            className={inputCls + " resize-none"}
          />
        </div>
        {err && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className={`${btnCls} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`}
          >
            {busy ? "Salvando..." : acao === "aprovar" ? "Aprovar" : "Rejeitar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)";
