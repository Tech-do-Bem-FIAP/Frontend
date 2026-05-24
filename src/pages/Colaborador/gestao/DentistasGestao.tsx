import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2, X, Search } from "lucide-react";
import { Skeleton } from "../../../components/Skeleton/Skeleton";
import {
  getTodosDentistas,
  getTodosColaboradores,
  criarDentista,
  atualizarDentista,
  excluirDentista,
} from "../../../data/api";
import { ApiError } from "../../../api/client";
import { temNivel } from "../../../types";
import type { Dentista, Colaborador, CargoColaborador } from "../../../types";

interface FormValues {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  cro: string;
  especialidade: string;
  disponibilidade: string;
  id_colaborador: string;
}

function errMsg(e: unknown) {
  if (e instanceof ApiError) return e.status === 0 ? "Sem conexão com a API." : e.message;
  return "Erro inesperado.";
}

export function DentistasGestao({ cargo }: { cargo: CargoColaborador }) {
  const podeCriarExcluir = temNivel(cargo, 4); // Admin
  const podeEditar = temNivel(cargo, 2);       // Aux+

  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Dentista | "new" | null>(null);
  const [deleting, setDeleting] = useState<Dentista | null>(null);
  const [filtro, setFiltro] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [ds, cs] = await Promise.all([
        getTodosDentistas(),
        getTodosColaboradores(),
      ]);
      setDentistas(ds);
      setColaboradores(cs);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const nomeColab = (id: number | null) =>
    id == null
      ? "Sem responsável"
      : colaboradores.find((c) => c.id === id)?.nome ?? `#${id}`;

  const visiveis = dentistas
    .filter((d) => {
      const q = filtro.trim().toLowerCase();
      if (!q) return true;
      return (
        d.nome.toLowerCase().includes(q) ||
        d.cro.toLowerCase().includes(q) ||
        d.especialidade.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary-color)" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome, CRO ou especialidade"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
          />
        </div>
        {podeCriarExcluir && (
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo dentista
          </button>
        )}
      </div>

      {!podeCriarExcluir && podeEditar && (
        <p className="text-xs text-(--text-secondary-color) bg-(--brand-tertiary) border border-(--brand-primary)/20 rounded-lg px-3 py-2">
          Cadastro e exclusão são exclusivos do Administrador. Você pode editar dados existentes.
        </p>
      )}

      {editing && (
        <DentistaForm
          initial={editing === "new" ? null : editing}
          isNew={editing === "new"}
          colaboradores={colaboradores}
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
          {filtro ? "Nenhum dentista bate com o filtro." : "Nenhum dentista cadastrado."}
        </p>
      )}

      {!loading && !err && visiveis.map((d) => (
        <div
          key={d.id}
          className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl p-4 flex items-start justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-(--brand-secondary) truncate">{d.nome}</p>
            <p className="text-xs text-(--text-secondary-color) mt-0.5 truncate">
              {d.especialidade} · CRO {d.cro}
            </p>
            <p className="text-xs text-(--text-secondary-color) mt-0.5 truncate">
              {d.email}
              {d.cpf && <> · CPF {d.cpf}</>}
            </p>
            <p className="text-xs text-(--text-secondary-color) mt-0.5">
              Responsável: <span className="text-(--text-color)">{nomeColab(d.id_colaborador)}</span>
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {podeEditar && (
              <button
                onClick={() => setEditing(d)}
                title="Editar"
                className="p-2 text-(--brand-primary) hover:bg-(--brand-tertiary) rounded-lg"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {podeCriarExcluir && (
              <button
                onClick={() => setDeleting(d)}
                title="Excluir"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}

      {deleting && (
        <ConfirmDelete
          dentista={deleting}
          onCancel={() => setDeleting(null)}
          onConfirmed={async () => { setDeleting(null); await load(); }}
        />
      )}
    </div>
  );
}

function DentistaForm({
  initial, isNew, colaboradores, onClose, onSaved,
}: {
  initial: Dentista | null;
  isNew: boolean;
  colaboradores: Colaborador[];
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
          cro: initial.cro,
          especialidade: initial.especialidade,
          disponibilidade: String(initial.disponibilidade),
          id_colaborador: initial.id_colaborador != null ? String(initial.id_colaborador) : "",
        }
      : {
          nome: "", cpf: "", email: "", senha: "",
          cro: "", especialidade: "", disponibilidade: "1", id_colaborador: "",
        },
  });

  const onSubmit = async (v: FormValues) => {
    setSubmitErr(null);
    const payload = {
      nome: v.nome.trim(),
      cpf: v.cpf.trim(),
      email: v.email.trim(),
      cro: v.cro.trim(),
      especialidade: v.especialidade.trim(),
      disponibilidade: Number(v.disponibilidade) || 0,
      id_colaborador: v.id_colaborador ? Number(v.id_colaborador) : null,
    };
    try {
      if (initial) {
        const senha = v.senha.trim();
        await atualizarDentista(initial.id, payload, senha === "" ? null : senha);
      } else {
        await criarDentista(payload, v.senha);
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
          {isNew ? "Novo dentista" : "Editar dentista"}
        </h3>
        <button onClick={onClose} title="Fechar" className="text-(--text-secondary-color) hover:text-(--text-color)">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" error={errors.nome?.message}>
          <input {...register("nome", { required: "Obrigatório" })} className={inputCls} />
        </Field>
        <Field label="CPF" error={errors.cpf?.message}>
          <input
            {...register("cpf", { required: "Obrigatório" })}
            placeholder="000.000.000-00"
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
        <Field label="CRO (000000-UF)" error={errors.cro?.message}>
          <input
            {...register("cro", {
              required: "Obrigatório",
              pattern: { value: /^\d{6}-[A-Z]{2}$/i, message: "Formato 000000-UF" },
            })}
            placeholder="100001-SP"
            className={inputCls}
          />
        </Field>
        <Field label="Especialidade" error={errors.especialidade?.message}>
          <input
            {...register("especialidade", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field label="Disponibilidade" error={errors.disponibilidade?.message}>
          <select
            {...register("disponibilidade", { required: "Obrigatório" })}
            className={inputCls}
          >
            <option value="1">Disponível</option>
            <option value="0">Indisponível</option>
          </select>
        </Field>
        <Field label="Colaborador responsável" error={errors.id_colaborador?.message}>
          <select {...register("id_colaborador")} className={inputCls}>
            <option value="">Sem responsável</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} ({c.cargo})</option>
            ))}
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
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-(--text-color) mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function ConfirmDelete({
  dentista, onCancel, onConfirmed,
}: {
  dentista: Dentista;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const confirm = async () => {
    setBusy(true); setErr(null);
    try {
      await excluirDentista(dentista.id);
      onConfirmed();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
        <h3 className="font-semibold text-(--brand-secondary)">Excluir dentista?</h3>
        <p className="text-sm text-(--text-color)">
          Tem certeza que quer excluir <span className="font-medium">{dentista.nome}</span>?
          Pacientes e atendimentos vinculados podem ser afetados.
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
