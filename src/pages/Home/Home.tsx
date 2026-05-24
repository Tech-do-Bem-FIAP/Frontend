import { Link } from "react-router";
import {
  HeartHandshake,
  Users,
  Stethoscope,
  CalendarCheck,
  Bell,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "../../components/Logo/Logo";
import { Footer } from "../../components/Footer/Footer";
import { Header } from "../../components/Header/Header";

const features = [
  {
    Icon: Users,
    title: "Pacientes",
    desc: "Cadastro, histórico clínico e acompanhamento individual de cada pessoa atendida.",
  },
  {
    Icon: Stethoscope,
    title: "Dentistas",
    desc: "Gestão da equipe de voluntários, especialidades e distribuição de atendimentos.",
  },
  {
    Icon: CalendarCheck,
    title: "Atendimentos",
    desc: "Agendamento, registro e controle dos atendimentos em andamento e concluídos.",
  },
  {
    Icon: Bell,
    title: "Notificações",
    desc: "Comunicação centralizada entre colaboradores, dentistas e pacientes.",
  },
];

function Home() {
  return (
    <>
      <Header />

      <main className="bg-(--brand-tertiary) min-h-screen animate-fade-in">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-br from-(--brand-tertiary) via-white to-(--brand-tertiary)"
          />
          <div className="container_page relative py-24 text-center">
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-(--brand-secondary) bg-white border border-(--brand-primary)/20 rounded-full px-4 py-1.5 mb-6">
              <HeartHandshake className="w-3.5 h-3.5" />
              Parceiro da Turma do Bem
            </span>
            <h1 className="title font-bold mb-6">Tech do Bem</h1>
            <p className="text-xl text-(--text-color) max-w-2xl mx-auto leading-relaxed">
              A plataforma de gestão odontológica criada para a{" "}
              <span className="font-bold text-(--brand-secondary)">
                Turma do Bem
              </span>{" "}
              — centralizando pacientes, dentistas, atendimentos e comunicação
              em um único lugar, de forma gratuita e acessível.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Acessar a plataforma <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-white hover:bg-(--brand-tertiary) text-(--brand-secondary) border border-(--brand-primary)/30 px-6 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                Conheça o projeto
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container_page py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-medium uppercase tracking-wider text-(--brand-primary) mb-2">
              O que a plataforma faz
            </p>
            <h2 className="title3 font-bold">
              Tudo o que a Turma do Bem precisa, em um lugar só.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-(--brand-primary)/30 transition-all"
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

        {/* Manifesto cards */}
        <section className="space-y-0">
          <div className="bg-white border-l-4 border-l-(--brand-primary) border-b border-gray-100 py-12">
            <div className="container_page">
              <h2 className="title3 font-bold mb-4">
                O PRIVILÉGIO DE PODER MUDAR VIDAS
              </h2>
              <p className="text-lg text-(--text-color) leading-relaxed max-w-3xl">
                Para nós, a parceria com a Turma do Bem é mais do que uma
                relação profissional.{" "}
                <span className="font-bold">
                  Acreditamos que dar nossas mãos é uma oportunidade única.
                </span>
              </p>
            </div>
          </div>

          <div className="bg-linear-to-r from-(--card-primary) to-(--card-secondary) py-12">
            <div className="container_page">
              <h2 className="title2 mb-4">A COMPAIXÃO COMO VALOR</h2>
              <p className="text-xl text-(--brand-tertiary) leading-relaxed max-w-3xl">
                Compaixão é um valor inegociável. Não se trata de vender uma
                solução, mas de apresentar{" "}
                <span className="font-bold">
                  um caminho que todos possam atravessar juntos.
                </span>
              </p>
            </div>
          </div>

          <div className="bg-white border-l-4 border-l-(--brand-primary) border-b border-gray-100 py-12">
            <div className="container_page">
              <h2 className="title3 font-bold mb-4">
                A TECNOLOGIA PARA IMPULSIONAR
              </h2>
              <p className="text-lg text-(--text-color) leading-relaxed max-w-3xl">
                Ferramentas não substituem o calor humano. Com a Tech do Bem
                não é diferente: somos human-first e não abrimos mão disso. A
                tecnologia, para nós, é isso:{" "}
                <span className="font-bold text-(--brand-secondary)">
                  propulsão para propósitos humanos.
                </span>
              </p>
            </div>
          </div>

          <div className="bg-(--brand-tertiary) border-b border-gray-200 py-12">
            <div className="container_page flex justify-center items-center gap-4">
              <h2 className="title2 h-fit my-auto text-center">ISSO É</h2>
              <Logo variant="secondary" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container_page py-20 text-center">
          <Sparkles className="w-8 h-8 text-(--brand-primary) mx-auto mb-4" />
          <h3 className="title3 font-bold mb-6">
            Porque, juntos, <br />
            somos mais fortes.
          </h3>
          <p className="text-lg text-(--text-color) max-w-xl mx-auto leading-relaxed mb-8">
            Convidamos a Turma do Bem a dar este próximo passo{" "}
            <span className="font-bold">em direção ao futuro</span>, onde mais
            sorrisos são alcançados e mais vidas são transformadas.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-(--brand-primary) hover:bg-(--brand-secondary) text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Acessar a plataforma <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Home;
