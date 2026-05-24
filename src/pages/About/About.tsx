import {
  Target,
  Database,
  Sparkles,
  HeartHandshake,
  Layers,
  Rocket,
  Compass,
} from "lucide-react";
import { Footer } from "../../components/Footer/Footer";
import { Header } from "../../components/Header/Header";

const pillars = [
  {
    Icon: Target,
    title: "Foco em organização",
    desc: "Ferramentas para gestão interna da ONG, monitoramento de pacientes e coordenação dos profissionais voluntários — substituindo planilhas, papéis avulsos e comunicação dispersa.",
  },
  {
    Icon: Layers,
    title: "Visão integrada",
    desc: "Cadastro e acompanhamento individual de pacientes, gestão da equipe de dentistas e controle dos atendimentos em andamento, realizados e a iniciar — tudo em um lugar só.",
  },
  {
    Icon: Database,
    title: "Centralização segura",
    desc: "As informações ficam guardadas de forma centralizada e protegida, garantindo segurança, transparência e integração entre os dados da operação.",
  },
  {
    Icon: Sparkles,
    title: "Pronta para o futuro",
    desc: "A próxima fase agrega Inteligência Artificial para automatizar processos burocráticos e devolver tempo aos colaboradores da Turma do Bem.",
  },
];

const timeline = [
  {
    Icon: HeartHandshake,
    label: "Por que nasceu",
    body: "A Tech do Bem nasceu para otimizar a gestão e o acompanhamento de atendimentos da Turma do Bem, ampliando o impacto social do projeto.",
  },
  {
    Icon: Compass,
    label: "Onde estamos",
    body: "Hoje a plataforma cobre o fluxo completo de pacientes, dentistas, atendimentos e notificações, com perfis distintos para administradores, colaboradores e voluntários.",
  },
  {
    Icon: Rocket,
    label: "Para onde vamos",
    body: "Agregar IA para processos burocráticos, ampliar a base de voluntários e tornar a operação cada vez mais escalável — sem perder o lado humano.",
  },
];

function About() {
  return (
    <>
      <Header />

      <main className="bg-(--brand-tertiary) min-h-screen">
        <section className="container_page py-16">
          <p className="text-xs font-medium uppercase tracking-wider text-(--brand-primary) mb-2">
            Sobre o projeto
          </p>
          <h1 className="title font-bold mb-6">A Tech do Bem</h1>
          <p className="text-lg text-(--text-color) leading-relaxed max-w-3xl">
            Tecnologia a serviço de quem cuida. A plataforma foi criada para
            tornar os processos mais simples e conectados, unindo tecnologia e
            propósito social para gerar impacto real e transformar vidas.
          </p>
        </section>

        <section className="container_page pb-12">
          <h2 className="title3 font-bold mb-6">Pilares</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-(--brand-tertiary) text-(--brand-primary) flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-(--brand-secondary) mb-2">
                  {title}
                </h3>
                <p className="text-sm text-(--text-color) leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container_page pb-20">
          <h2 className="title3 font-bold mb-6">A nossa jornada</h2>
          <ol className="relative border-l-2 border-(--brand-primary)/30 ml-3 space-y-8">
            {timeline.map(({ Icon, label, body }) => (
              <li key={label} className="ml-6 relative">
                <span className="absolute -left-[2.4rem] top-0 w-10 h-10 rounded-full bg-white border-2 border-(--brand-primary) text-(--brand-primary) flex items-center justify-center shadow-sm">
                  <Icon className="w-4 h-4" />
                </span>
                <p className="text-xs font-medium uppercase tracking-wider text-(--brand-primary) mb-1">
                  {label}
                </p>
                <p className="text-base text-(--text-color) leading-relaxed">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default About;
