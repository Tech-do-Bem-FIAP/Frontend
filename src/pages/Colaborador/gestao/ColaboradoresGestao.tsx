import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2, X, Search } from "lucide-react";
import { Skeleton } from "../../../components/Skeleton/Skeleton";
import {
  getTodosColaboradores,
  criarColaborador,
  atualizarColaborador,
  excluirColaborador,
} from "../../../data/api";
import { ApiError } from "../../../api/client";
import { useAuth } from "../../../contexts/AuthContext";
import { NIVEL_CARGO } from "../../../types";
import type { Colaborador, CargoColaborador } from "../../../types";

interface FormValues {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  cargo: CargoColaborador;
  disponibilidade: string;
}

const CARGOS: CargoColaborador[] = ["Estagiário", "Auxiliar", "Coordenador", "Administrador"];

function errMsg(e: unknown) {
  if (e instanceof ApiError) return e.status === 0 ? "Sem conexão com a API." : e.message;
  return "Erro inesperado.";
}

function badgeCargo(cargo: CargoColaborador): string {
  switch (cargo) {
    case "Administrador": return "bg-amber-200 text-amber-900";
    case "Coordenador":   return "bg-purple-100 text-purple-700";
    case "Auxiliar":      return "bg-blue-100 text-blue-700";
    case "Estagiário":    return "bg-gray-100 text-gray-700";
  }
}

export function ColaboradoresGestao() {
  const { user } = useAuth();
  const meuId = user!.id;

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Colaborador | "new" | null>(null);
  const [deleting, setDeleting] = useState<Colaborador | null>(null);
  const [filtro, setFiltro] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setColaboradores(await getTodosColaboradores());
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visiveis = colaboradores
    .filter((c) => {
      const q = filtro.trim().toLowerCase();
      if (!q) return true;
      return (
        c.nome.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.cargo.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Cargo maior primeiro, depois alfabético por nome
      const cargoDiff = (NIVEL_CARGO[b.cargo] ?? 0) - (NIVEL_CARGO[a.cargo] ?? 0);
      return cargoDiff !== 0 ? cargoDiff : a.nome.localeCompare(b.nome);
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary-color)" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
          />
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo colaborador
        </button>
      </div>

      {editing && (
        <ColaboradorForm
          initial={editing === "new" ? null : editing}
          isNew={editing === "new"}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}

      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
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
          {filtro ? "Nenhum colaborador bate com o filtro." : "Nenhum colaborador cadastrado."}
        </p>
      )}

      {!loading && !err && visiveis.map((c) => {
        const ehVoce = c.id === meuId;
        return (
          <div
            key={c.id}
            className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-(--brand-secondary) truncate">{c.nome}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeCargo(c.cargo)}`}>
                  {c.cargo}
                </span>
                {ehVoce && (
                  <span className="text-[10px] bg-(--brand-tertiary) text-(--brand-secondary) rounded-full px-2 py-0.5 font-medium">
                    Você
                  </span>
                )}
              </div>
              <p className="text-xs text-(--text-secondary-color) mt-0.5 truncate">
                {c.email} · CPF {c.cpf}
              </p>
              <p className="text-xs text-(--text-secondary-color) mt-0.5">
                {c.disponibilidade === 1 ? "Disponível" : "Indisponível"}
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
                disabled={ehVoce}
                title={ehVoce ? "Você não pode se autoexcluir" : "Excluir"}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {deleting && (
        <ConfirmDelete
          colaborador={deleting}
          onCancel={() => setDeleting(null)}
          onConfirmed={async () => { setDeleting(null); await load(); }}
        />
      )}
    </div>
  );
}

function ColaboradorForm({
  initial, isNew, onClose, onSaved,
}: {
  initial: Colaborador | null;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initial
      ? {
          nome: initial.nome,
          cpf: initial.cpf,
          email: initial.email,
          senha: "",
          cargo: initial.cargo,
          disponibilidade: String(initial.disponibilidade),
        }
      : {
          nome: "", cpf: "", email: "", senha: "",
          cargo: "Auxiliar", disponibilidade: "1",
        },
  });

  const onSubmit = async (v: FormValues) => {
    setSubmitErr(null);
    const payload = {
      nome: v.nome.trim(),
      cpf: v.cpf.trim(),
      email: v.email.trim(),
      cargo: v.cargo,
      disponibilidade: Number(v.disponibilidade) || 0,
    };
    try {
      if (initial) {
        const senha = v.senha.trim();
        await atualizarColaborador(initial.id, payload, senha === "" ? null : senha);
      } else {
        await criarColaborador(payload, v.senha);
      }
      onSaved();
    } catch (e) {
      setSubmitErr(errMsg(e));
    }
  };

  return (
    <div className="bg-white border-2 border-(--brand-primary) rounded-xl shadow-md p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-(--brand-secondary)">
          {isNew ? "Novo colaborador" : "Editar colaborador"}
        </h3>
        <button onClick={onClose} title="Fechar" className="text-(--text-secondary-color) hover:text-(--text-color)">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" error={errors.nome?.message} span2>
          <input {...register("nome", { required: "Obrigatório" })} className={inputCls} />
        </Field>
        <Field label="CPF" error={errors.cpf?.message}>
          <input
            {...register("cpf", { required: "Obrigatório" })}
            placeholder="00000000000"
            className={inputCls}
          />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <input
            type="email"
            {...register("email", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field
          label={isNew ? "Senha" : "Nova senha (opcional)"}
          error={errors.senha?.message}
        >
          <input
            type="password"
            {...register("senha", isNew ? { required: "Obrigatório" } : {})}
            placeholder={isNew ? "" : "deixe em branco para manter"}
            className={inputCls}
          />
        </Field>
        <Field label="Cargo" error={errors.cargo?.message}>
          <select {...register("cargo", { required: "Obrigatório" })} className={inputCls}>
            {CARGOS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Disponibilidade" error={errors.disponibilidade?.message} span2>
          <select
            {...register("disponibilidade", { required: "Obrigatório" })}
            className={inputCls}
          >
            <option value="1">Disponível</option>
            <option value="0">Indisponível</option>
          </select>
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
            {isSubmitting ? "Salvando..." : isNew ? "Criar" : "Salvar"}
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
  colaborador, onCancel, onConfirmed,
}: {
  colaborador: Colaborador;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const confirm = async () => {
    setBusy(true); setErr(null);
    try {
      await excluirColaborador(colaborador.id);
      onConfirmed();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
        <h3 className="font-semibold text-(--brand-secondary)">Excluir colaborador?</h3>
        <p className="text-sm text-(--text-color)">
          Tem certeza que quer excluir <span className="font-medium">{colaborador.nome}</span> ({colaborador.cargo})?
          Dentistas vinculados podem ficar sem responsável.
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
