import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pencil, Plus, Trash2, X, Loader2, Search, MapPin } from "lucide-react";
import {
  getTodosPacientes,
  getTodosDentistas,
  criarPaciente,
  atualizarPaciente,
  excluirPaciente,
} from "../../../data/api";
import { ApiError } from "../../../api/client";
import type { Paciente, Dentista } from "../../../types";
import { consultarCep, geocodificar } from "../../../utils/geocoding";

interface FormValues {
  nome: string;
  cpf: string;
  data_nasc: string;
  telefone: string;
  email: string;
  id_dentista: string; // <select> sempre devolve string
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

function calcIdade(dataNasc: string): number | null {
  const d = new Date(dataNasc);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let idade = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) idade--;
  return idade;
}

function errMsg(e: unknown) {
  if (e instanceof ApiError) return e.status === 0 ? "Sem conexão com a API." : e.message;
  return "Erro inesperado.";
}

const EMPTY: FormValues = {
  nome: "", cpf: "", data_nasc: "", telefone: "", email: "", id_dentista: "",
  cep: "", logradouro: "", bairro: "", cidade: "", uf: "",
};

export function PacientesGestao() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Paciente | "new" | null>(null);
  const [deleting, setDeleting] = useState<Paciente | null>(null);
  const [filtro, setFiltro] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [ps, ds] = await Promise.all([getTodosPacientes(), getTodosDentistas()]);
      setPacientes(ps);
      setDentistas(ds);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const nomeDentista = (id: number) =>
    dentistas.find((d) => d.id === id)?.nome ?? `#${id}`;

  const visiveis = pacientes
    .filter((p) => {
      const q = filtro.trim().toLowerCase();
      if (!q) return true;
      return (
        p.nome.toLowerCase().includes(q) ||
        (p.cpf ?? "").includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const fechar = () => setEditing(null);

  const onSaved = async () => {
    fechar();
    await load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-(--text-secondary-color)" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar por nome, CPF ou e-mail"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
          />
        </div>
        <button
          onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo paciente
        </button>
      </div>

      {editing && (
        <PacienteForm
          initial={editing === "new" ? null : editing}
          dentistas={dentistas}
          onClose={fechar}
          onSaved={onSaved}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-(--text-secondary-color)">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Carregando pacientes...</span>
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
          {filtro ? "Nenhum paciente bate com o filtro." : "Nenhum paciente cadastrado."}
        </p>
      )}

      {!loading && !err && visiveis.map((p) => {
        const idade = calcIdade(p.data_nasc);
        return (
          <div
            key={p.id}
            className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-(--brand-secondary) truncate">
                {p.nome}
                {idade != null && (
                  <span className="ml-2 text-xs font-normal text-(--text-secondary-color)">
                    {idade} anos
                  </span>
                )}
              </p>
              <p className="text-xs text-(--text-secondary-color) mt-0.5 truncate">
                {p.email} · {p.telefone}
              </p>
              <p className="text-xs text-(--text-secondary-color) mt-0.5">
                Dentista: <span className="text-(--text-color)">{nomeDentista(p.id_dentista)}</span>
                {p.cpf && <> · CPF {p.cpf}</>}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setEditing(p)}
                title="Editar"
                className="p-2 text-(--brand-primary) hover:bg-(--brand-tertiary) rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleting(p)}
                title="Excluir"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {deleting && (
        <ConfirmDelete
          paciente={deleting}
          onCancel={() => setDeleting(null)}
          onConfirmed={async () => { setDeleting(null); await load(); }}
        />
      )}
    </div>
  );
}

function PacienteForm({
  initial, dentistas, onClose, onSaved,
}: {
  initial: Paciente | null;
  dentistas: Dentista[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = initial != null;
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErr, setCepErr] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial && initial.latitude != null && initial.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null,
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const cepDebounce = useRef<number | null>(null);

  const {
    register, handleSubmit, setValue, getValues, watch, formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initial
      ? {
          nome: initial.nome,
          cpf: initial.cpf ?? "",
          data_nasc: initial.data_nasc.slice(0, 10),
          telefone: initial.telefone,
          email: initial.email,
          id_dentista: String(initial.id_dentista),
          cep: initial.cep ?? "",
          logradouro: initial.logradouro ?? "",
          bairro: initial.bairro ?? "",
          cidade: initial.cidade ?? "",
          uf: initial.uf ?? "",
        }
      : EMPTY,
  });

  const cep = watch("cep");

  /** Dispara ViaCEP quando o CEP fica completo (8 dígitos). */
  const lookupCep = useCallback(async (raw: string) => {
    const limpo = raw.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    setCepLoading(true);
    setCepErr(null);
    try {
      const endereco = await consultarCep(limpo);
      if (!endereco) {
        setCepErr("CEP não encontrado.");
        return;
      }
      // Preserva valores manuais já digitados quando ViaCEP devolve campos vazios.
      if (endereco.logradouro) setValue("logradouro", endereco.logradouro, { shouldDirty: true });
      if (endereco.bairro) setValue("bairro", endereco.bairro, { shouldDirty: true });
      if (endereco.cidade) setValue("cidade", endereco.cidade, { shouldDirty: true });
      if (endereco.uf) setValue("uf", endereco.uf, { shouldDirty: true });
      // Coords ficam stale se o usuário trocar de CEP — força nova busca manual.
      setCoords(null);
    } finally {
      setCepLoading(false);
    }
  }, [setValue]);

  // Debounce de 400ms no onChange do CEP — backup caso o user não saia do campo.
  useEffect(() => {
    if (cepDebounce.current != null) {
      window.clearTimeout(cepDebounce.current);
    }
    const limpo = (cep ?? "").replace(/\D/g, "");
    if (limpo.length !== 8) return;
    cepDebounce.current = window.setTimeout(() => {
      void lookupCep(limpo);
    }, 400);
    return () => {
      if (cepDebounce.current != null) window.clearTimeout(cepDebounce.current);
    };
  }, [cep, lookupCep]);

  const localizarNoMapa = async () => {
    const v = getValues();
    if (!v.logradouro || !v.cidade || !v.uf) {
      setGeoErr("Preencha logradouro, cidade e UF antes de geocodificar.");
      return;
    }
    setGeoLoading(true);
    setGeoErr(null);
    try {
      const result = await geocodificar({
        logradouro: v.logradouro,
        bairro: v.bairro,
        cidade: v.cidade,
        uf: v.uf,
      });
      if (!result) {
        setGeoErr("Endereço não localizado no Nominatim.");
        setCoords(null);
        return;
      }
      setCoords(result);
    } finally {
      setGeoLoading(false);
    }
  };

  const onSubmit = async (v: FormValues) => {
    setSubmitErr(null);
    const cepLimpo = v.cep.replace(/\D/g, "");
    const payload = {
      nome: v.nome.trim(),
      cpf: v.cpf.trim() || null,
      data_nasc: v.data_nasc,
      telefone: v.telefone.trim(),
      email: v.email.trim(),
      id_dentista: Number(v.id_dentista),
      cep: cepLimpo || null,
      logradouro: v.logradouro.trim() || null,
      bairro: v.bairro.trim() || null,
      cidade: v.cidade.trim() || null,
      uf: v.uf.trim().toUpperCase() || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    };
    try {
      if (isEdit && initial) await atualizarPaciente(initial.id, payload);
      else await criarPaciente(payload);
      onSaved();
    } catch (e) {
      setSubmitErr(errMsg(e));
    }
  };

  return (
    <div className="bg-white border-2 border-(--brand-primary) rounded-xl shadow-md p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-(--brand-secondary)">
          {isEdit ? "Editar paciente" : "Novo paciente"}
        </h3>
        <button onClick={onClose} title="Fechar" className="text-(--text-secondary-color) hover:text-(--text-color)">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" error={errors.nome?.message}>
          <input
            {...register("nome", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field label="CPF (opcional)" error={errors.cpf?.message}>
          <input {...register("cpf")} placeholder="000.000.000-00" className={inputCls} />
        </Field>
        <Field label="Data de nascimento" error={errors.data_nasc?.message}>
          <input
            type="date"
            {...register("data_nasc", { required: "Obrigatório" })}
            className={inputCls}
          />
        </Field>
        <Field label="Telefone" error={errors.telefone?.message}>
          <input
            {...register("telefone", { required: "Obrigatório" })}
            placeholder="(00) 00000-0000"
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
        <Field label="Dentista responsável" error={errors.id_dentista?.message}>
          <select
            {...register("id_dentista", { required: "Selecione" })}
            className={inputCls}
          >
            <option value="">Selecione...</option>
            {dentistas.map((d) => (
              <option key={d.id} value={d.id}>{d.nome}</option>
            ))}
          </select>
        </Field>

        {/* ─── Endereço (opcional, usado pra ML e mapa) ─── */}
        <div className="sm:col-span-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-(--brand-secondary) mb-2 mt-2">
            Endereço (opcional)
          </p>
        </div>
        <Field label="CEP" error={cepErr ?? undefined}>
          <div className="relative">
            <input
              {...register("cep")}
              inputMode="numeric"
              maxLength={9}
              placeholder="00000-000"
              onBlur={(e) => { void lookupCep(e.target.value); }}
              className={inputCls}
            />
            {cepLoading && (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-(--brand-primary)" />
            )}
          </div>
        </Field>
        <Field label="UF">
          <input {...register("uf")} maxLength={2} placeholder="SP" className={inputCls} />
        </Field>
        <Field label="Logradouro">
          <input {...register("logradouro")} placeholder="Rua, Av., etc." className={inputCls} />
        </Field>
        <Field label="Bairro">
          <input {...register("bairro")} className={inputCls} />
        </Field>
        <Field label="Cidade">
          <input {...register("cidade")} className={inputCls} />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={localizarNoMapa}
            disabled={geoLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-(--brand-primary) text-(--brand-primary) hover:bg-(--brand-tertiary) transition-colors disabled:opacity-50 w-full justify-center"
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Localizar no mapa
          </button>
        </div>
        {coords && (
          <p className="sm:col-span-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
            Coordenadas: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} &#10003;
          </p>
        )}
        {geoErr && (
          <p className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            {geoErr}
          </p>
        )}

        {submitErr && (
          <p className="sm:col-span-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {submitErr}
          </p>
        )}

        <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
  paciente, onCancel, onConfirmed,
}: {
  paciente: Paciente;
  onCancel: () => void;
  onConfirmed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const confirm = async () => {
    setBusy(true);
    setErr(null);
    try {
      await excluirPaciente(paciente.id);
      onConfirmed();
    } catch (e) {
      setErr(errMsg(e));
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-3">
        <h3 className="font-semibold text-(--brand-secondary)">Excluir paciente?</h3>
        <p className="text-sm text-(--text-color)">
          Tem certeza que quer excluir <span className="font-medium">{paciente.nome}</span>?
          Atendimentos e exames vinculados podem ser afetados.
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
