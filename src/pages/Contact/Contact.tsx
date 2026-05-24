import { Mail, MessageSquare, ArrowUpRight } from "lucide-react";
import { Footer } from "../../components/Footer/Footer";
import { Header } from "../../components/Header/Header";

const contacts = [
  {
    label: "Geral",
    desc: "Dúvidas, parcerias e tudo o que não se encaixa nos outros canais.",
    email: "tdb.fiap@gmail.com",
  },
  {
    label: "UX, UI & Frontend",
    desc: "Sugestões sobre interface, experiência e usabilidade da plataforma.",
    email: "tdb.fiap.frontend@gmail.com",
  },
  {
    label: "Backend Development",
    desc: "Questões técnicas sobre API, dados e integrações.",
    email: "tdb.fiap.backend@gmail.com",
  },
  {
    label: "AI & Business",
    desc: "Conversas sobre IA, automações e o futuro da plataforma.",
    email: "tdb.fiap.business@gmail.com",
  },
];

function Contact() {
  return (
    <>
      <Header />

      <main className="bg-(--brand-tertiary) min-h-screen">
        <section className="container_page py-16">
          <p className="text-xs font-medium uppercase tracking-wider text-(--brand-primary) mb-2 inline-flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Fale com a gente
          </p>
          <h1 className="title font-bold mb-4">Fale conosco</h1>
          <p className="text-lg text-(--text-color) mb-12 max-w-2xl">
            Em caso de dúvidas ou para mais informações, entre em contato pelo
            canal que melhor descreve seu assunto. Respondemos em até 2 dias
            úteis.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {contacts.map(({ label, desc, email }) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="group bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm hover:shadow-md hover:border-l-(--brand-secondary) transition-all p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-(--brand-tertiary) text-(--brand-primary) flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-(--brand-secondary) mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-(--text-color) leading-relaxed mb-3">
                    {desc}
                  </p>
                  <p className="text-sm text-(--brand-primary) font-medium inline-flex items-center gap-1 break-all">
                    {email}
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Contact;
