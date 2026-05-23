import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2, X, Loader2, Search, MapPin, Calendar } from "lucide-react";
import {
  getTodasCampanhas,
  criarCampanha,
  atualizarCampanha,
  excluirCampanha,
} from "../../../data/api";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../../contexts/AuthContext";
import type { Campanha } from "../../../types";

interface FormValues {
  nome: string;
  local: string;
  data_inicio: string;
  data_fim: string;
}

function errMsg(e: unknown) {
  if (e instanceof ApiError) return e.status === 0 ? "Sem conexão com a API." : e.message;
  return "Erro inesperado.";
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function statusCampanha(c: Campanha): { label: string; cls: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(c.data_inicio);
  const fim = new Date(c.data_fim);
  if (hoje < inicio) return { label: "Agendada", cls: "bg-blue-100 text-blue-700" };
  if (hoje > fim) return { label: "Encerrada", cls: "bg-gray-100 text-gray-600" };
  return { label: "Em andamento", cls: "bg-green-100 text-green-700" };
}

export function CampanhasGestao() {
  const { user } = useAuth();
  const colaboradorId = user!.id;
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Campanha | "new" | null>(null);
  const [deleting, setDeleting] = useState<Campanha | null>(null);
  const [filtro, setFiltro] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setCampanhas(await getTodasCampanhas());
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visiveis = campanhas
    .filter((c) => {
      const q = filtro.trim().toLowerCase();
      if (!q) return true;
      return c.nome.toLowerCase().includes(q) || c.local.toLowerCase().includes(q);
    })
    .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary-color)" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome ou local"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
          />
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova campanha
        </button>
      </div>

      {editing && (
        <CampanhaForm
          initial={editing === "new" ? null : editing}
          colaboradorId={colaboradorId}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-(--text-secondary-color)">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando campanhas...</span>
        </div>
      )}

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
          {filtro ? "Nenhuma campanha bate com o filtro." : "Nenhuma campanha cadastrada."}
        </p>
      )}

      {!loading && !err && visiveis.map((c) => {
        const s = statusCampanha(c);
        return (
          <div
            key={c.id}
            className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-(--brand-secondary)">{c.nome}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                  {s.label}
                </span>
              </div>
              <p className="text-xs text-(--text-secondary-color) mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {c.local}
              </p>
              <p className="text-xs text-(--text-secondary-color) mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {fmtDate(c.data_inicio)} → {fmtDate(c.data_fim)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditing(c)}
                title="Editar"
                className="p-2 text-(--brand-primary) hover:bg-(--brand-tertiary) rounded-lg"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleting(c)}
                title="Excluir"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {deleting && (
        <ConfirmDelete
          campanha={deleting}
          onCancel={() => setDeleting(null)}
          onConfirmed={async () => { setDeleting(null); await load(); }}
        />
      )}
    </div>
  );
}

function CampanhaForm({
  initial, colaboradorId, onClose, onSaved,
}: {
  initial: Campanha | null;
  colaboradorId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = initial != null;
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const {
    register, handleSubmit, watch, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initial
      ? {
          nome: initial.nome,
          local: initial.local,
          data_inicio: initial.data_inicio.slice(0, 10),
          data_fim: initial.data_fim.slice(0, 10),
        }
      : { nome: "", local: "", data_inicio: "", data_fim: "" },
  });

  const dataInicio = watch("data_inicio");

  const onSubmit = async (v: FormValues) => {
    setSubmitErr(null);
    if (v.data_fim < v.data_inicio) {
      setSubmitErr("Data final não pode ser anterior à data inicial.");
      return;
    }
    const payload = {
      nome: v.nome.trim(),
      local: v.local.trim(),
      data_inicio: v.data_inicio,
      data_fim: v.data_fim,
      id_colaborador: initial?.id_colaborador ?? colaboradorId,
    };
    try {
      if (isEdit && initial) await atualizarCampanha(initial.id, payload);
      else await criarCampanha(payload);
      onSaved();
    } catch (e) {
      setSubmitErr(errMsg(e));
    }
  };

  return (
    <div className="bg-white border-2 border-(--brand-primary) rounded-xl shadow-md p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-(--brand-secondary)">
          {isEdit ? "Editar campanha" : "Nova campanha"}
        </h3>
        <button onClick={onClose} title="Fechar" className="text-(--text-secondary-color) hover:text-(--text-color)">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" error={errors.nome?.message} span2>
          <input
            {...register("nome", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field label="Local" error={errors.local?.message} span2>
          <input
            {...register("local", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field label="Data inicial" error={errors.data_inicio?.message}>
          <input
            type="date"
            {...register("data_inicio", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field label="Data final" error={errors.data_fim?.message}>
          <input
            type="date"
            min={dataInicio || undefined}
            {...register("data_fim", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>

        {submitErr && (
          <p className="sm:col-span-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {submitErr}
          </p>
        )}

        <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
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
            {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)";

function Field({
  label, error, span2, children,
}: { label: string; error?: string; span2?: boolean; children: React.ReactNode }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-(--text-color) mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function ConfirmDelete({
  campanha, onCancel, onConfirmed,
}: {
  campanha: Campanha;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const confirm = async () => {
    setBusy(true); setErr(null);
    try {
      await excluirCampanha(campanha.id);
      onConfirmed();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
        <h3 className="font-semibold text-(--brand-secondary)">Excluir campanha?</h3>
        <p className="text-sm text-(--text-color)">
          Tem certeza que quer excluir <span className="font-medium">{campanha.nome}</span>?
          Atendimentos vinculados a essa campanha podem ser afetados.
        </p>
        {err && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{err}</p>
        )}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}
