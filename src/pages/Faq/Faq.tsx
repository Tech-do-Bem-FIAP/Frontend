import { useMemo, useState } from "react";
import { Search, HelpCircle, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Accordion } from "../../components/Accordion/Accordion";
import { Footer } from "../../components/Footer/Footer";
import { Header } from "../../components/Header/Header";

type Categoria = "acesso" | "funcionalidades" | "privacidade";

interface FaqItem {
  categoria: Categoria;
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    categoria: "acesso",
    question: "Como poderei acessar o sistema e quais dispositivos são compatíveis?",
    answer:
      "O sistema foi desenvolvido para acesso via navegador web, permitindo que você acesse de qualquer dispositivo (computador, tablet ou smartphone) a qualquer momento. Basta ter conexão com internet para visualizar dados de pacientes, andamento de atendimentos, dentistas relacionados e outras informações de forma intuitiva.",
  },
  {
    categoria: "acesso",
    question: "Quem pode usar a plataforma e quais são os níveis de acesso?",
    answer:
      "A plataforma possui três perfis: Administrador (acesso total), Colaborador (gestão de dentistas, pacientes e atendimentos) e Dentista Voluntário (gestão dos próprios pacientes e registro de atendimentos). Cada perfil vê apenas o que é relevante para sua função, mantendo a segurança e privacidade dos dados.",
  },
  {
    categoria: "funcionalidades",
    question: "Como o sistema ajudará no acompanhamento de pacientes e no envio de comunicados?",
    answer:
      "Desenvolvemos uma interface intuitiva que unifica todas as informações do paciente, incluindo histórico, próximas consultas e exames. Você poderá enviar notificações diretamente pelo sistema para dentistas e colaboradores, com informações sobre atendimentos e avisos importantes — tudo centralizado e sem depender de WhatsApp ou planilhas.",
  },
  {
    categoria: "funcionalidades",
    question: "Existe suporte disponível para resolver dúvidas burocráticas rapidamente?",
    answer:
      "Sim! Planejamos implementar um suporte alternativo baseado em Inteligência Artificial para agilizar questões burocráticas e solucionar dúvidas operacionais rapidamente. Casos mais complexos serão encaminhados para nossa equipe, garantindo que todas as demandas recebam a devida atenção sem atrasos.",
  },
  {
    categoria: "privacidade",
    question: "Como ficará o armazenamento de dados? Haverá risco de perda de informações durante a transição?",
    answer:
      "Implementamos uma estrutura de banco de dados com foco máximo em segurança e robustez. Todos os dados de pacientes, dentistas e colaboradores são armazenados de forma centralizada e protegida. A transição é supervisionada e os sistemas legados continuam operando em paralelo durante a migração, garantindo que nenhuma informação se perca.",
  },
];

const categoriaInfo: Record<Categoria, { label: string; Icon: typeof KeyRound }> = {
  acesso: { label: "Acesso", Icon: KeyRound },
  funcionalidades: { label: "Funcionalidades", Icon: Sparkles },
  privacidade: { label: "Privacidade e dados", Icon: ShieldCheck },
};

function Faq() {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q),
    );
  }, [busca]);

  const grupos = (["acesso", "funcionalidades", "privacidade"] as Categoria[])
    .map((cat) => ({
      cat,
      items: filtrados.filter((f) => f.categoria === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <Header />

      <main className="bg-(--brand-tertiary) min-h-screen">
        <section className="container_page py-16">
          <p className="text-xs font-medium uppercase tracking-wider text-(--brand-primary) mb-2 inline-flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Central de ajuda
          </p>
          <h1 className="title font-bold mb-4">Perguntas frequentes</h1>
          <p className="text-lg text-(--text-color) mb-10 max-w-2xl">
            Tire suas dúvidas sobre a plataforma Tech do Bem.
          </p>

          <div className="relative max-w-2xl mb-10">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-(--text-secondary-color)" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar uma pergunta..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-(--brand-primary)"
            />
          </div>

          {grupos.length === 0 && (
            <p className="text-center text-(--text-secondary-color) py-12">
              Nenhuma pergunta encontrada para "{busca}".
            </p>
          )}

          {grupos.map(({ cat, items }) => {
            const { label, Icon } = categoriaInfo[cat];
            return (
              <div key={cat} className="mb-10 last:mb-0">
                <h2 className="text-sm font-semibold text-(--brand-secondary) uppercase tracking-wider mb-4 inline-flex items-center gap-2">
                  <Icon className="w-4 h-4 text-(--brand-primary)" />
                  {label}
                </h2>
                <div className="flex flex-col gap-4 max-w-3xl">
                  {items.map((f) => (
                    <Accordion
                      key={f.question}
                      question={f.question}
                      answer={f.answer}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Faq;
