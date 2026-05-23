import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Navigate, Link } from "react-router";
import { ArrowLeft, X, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { login as apiLogin, solicitarCadastroExterno } from "../../data/api";
import { ApiError } from "../../api/client";
import { Logo } from "../../components/Logo/Logo";

type LoginForm = {
  email: string;
  senha: string;
};

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  if (user) return <Navigate to={`/${user.role}`} replace />;

  const onSubmit = async (data: LoginForm) => {
    try {
      const authed = await apiLogin(data.email, data.senha);
      login(authed);
      navigate(`/${authed.role}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 0
            ? "Não foi possível conectar à API."
            : "Email ou senha inválidos."
          : "Erro ao entrar. Tente novamente.";
      setError("senha", { message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-(--brand-tertiary) flex flex-col items-center justify-center px-4 py-10 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-(--brand-secondary) hover:text-(--brand-primary) font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar à página inicial
      </Link>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <Logo />
          <h1 className="title3 font-bold text-center">Tech do Bem</h1>
          <p className="text-sm text-(--tetx-color) mt-1">
            Sistema de Gestão Odontológica
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-(--brand-secondary) mb-6">
            Entrar na plataforma
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-(--text-color) mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                {...register("email", { required: "Informe o email." })}
                className="w-full px-4 py-2.5 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) focus:border-transparent"
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium text-(--text-color) mb-1"
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                placeholder="••••••"
                {...register("senha", { required: "Informe a senha." })}
                className="w-full px-4 py-2.5 bg-(--brand-tertiary) border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary) focus:border-transparent"
              />
              {errors.senha && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.senha.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-(--brand-primary) hover:bg-(--brand-secondary) text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-(--text-secondary-color)">
              Não tem cadastro?{" "}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="text-(--brand-primary) hover:text-(--brand-secondary) font-medium"
              >
                Solicitar acesso
              </button>
            </p>
          </div>
        </div>
      </div>

      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </div>
  );
}

interface SignupForm {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  senha: string;
  confirmar_senha: string;
  descricao: string;
}

function SignupModal({ onClose }: { onClose: () => void }) {
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    register, handleSubmit, watch, formState: { errors, isSubmitting },
  } = useForm<SignupForm>();

  const senha = watch("senha");

  const onSubmit = async (v: SignupForm) => {
    setSubmitErr(null);
    try {
      await solicitarCadastroExterno({
        nome: v.nome.trim(),
        cpf: v.cpf.replace(/\D/g, ""),
        email: v.email.trim(),
        senha: v.senha,
        telefone: v.telefone.trim(),
        descricao: v.descricao.trim(),
      });
      setSucesso(true);
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.status === 0 ? "Não foi possível conectar à API." : err.message
        : "Erro ao enviar solicitação.";
      setSubmitErr(msg);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-(--brand-secondary)">Solicitar acesso</h3>
          <button
            onClick={onClose}
            title="Fechar"
            className="text-(--text-secondary-color) hover:text-(--text-color)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sucesso ? (
          <div className="p-6 space-y-3 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <h4 className="font-semibold text-(--brand-secondary)">
              Solicitação enviada!
            </h4>
            <p className="text-sm text-(--text-color)">
              Em breve um administrador revisará sua solicitação. Você receberá retorno
              pelo e-mail informado.
            </p>
            <button
              onClick={onClose}
              className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-5 py-2 rounded-lg text-sm font-medium"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
            <p className="text-xs text-(--text-secondary-color) bg-(--brand-tertiary) rounded-lg p-3">
              Preencha seus dados. Sua solicitação será analisada por um Administrador
              ou Coordenador antes da liberação do acesso.
            </p>

            <Field label="Nome completo" error={errors.nome?.message}>
              <input
                {...register("nome", { required: "Obrigatório" })}
                className={inputCls}
              />
            </Field>

            <Field label="CPF" error={errors.cpf?.message}>
              <input
                {...register("cpf", {
                  required: "Obrigatório",
                  validate: (v) =>
                    v.replace(/\D/g, "").length === 11 || "CPF deve ter 11 dígitos",
                })}
                placeholder="000.000.000-00"
                className={inputCls}
              />
            </Field>

            <Field label="E-mail" error={errors.email?.message}>
              <input
                type="email"
                {...register("email", {
                  required: "Obrigatório",
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "E-mail inválido" },
                })}
                className={inputCls}
              />
            </Field>

            <Field label="Telefone (opcional)" error={errors.telefone?.message}>
              <input
                {...register("telefone")}
                placeholder="(00) 00000-0000"
                className={inputCls}
              />
            </Field>

            <Field label="Senha desejada" error={errors.senha?.message}>
              <input
                type="password"
                {...register("senha", {
                  required: "Obrigatório",
                  minLength: { value: 4, message: "Mínimo 4 caracteres" },
                })}
                className={inputCls}
              />
            </Field>

            <Field label="Confirmar senha" error={errors.confirmar_senha?.message}>
              <input
                type="password"
                {...register("confirmar_senha", {
                  required: "Confirme a senha",
                  validate: (v) => v === senha || "As senhas não batem",
                })}
                className={inputCls}
              />
            </Field>

            <Field label="Por que precisa de acesso?" error={errors.descricao?.message}>
              <textarea
                {...register("descricao", { required: "Descreva sua função/motivo" })}
                rows={3}
                placeholder="Ex: sou auxiliar da Dra. Rita e ajudo nas campanhas..."
                className={inputCls + " resize-none"}
              />
            </Field>

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
                {isSubmitting ? "Enviando..." : "Enviar solicitação"}
              </button>
            </div>
          </form>
        )}
      </div>
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

export default Login;
