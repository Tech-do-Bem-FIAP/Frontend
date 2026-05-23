import { Link } from "react-router";
import { Header } from "../../components/Header/Header";
import { Footer } from "../../components/Footer/Footer";

function NotFound() {
  return (
    <>
      <Header />
      <main className="bg-(--brand-tertiary) min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <p className="text-7xl font-bold text-(--brand-primary)">404</p>
          <h1 className="title3 font-bold mt-4 text-(--brand-secondary)">
            Página não encontrada
          </h1>
          <p className="text-(--text-color) mt-3 leading-relaxed">
            O endereço acessado não existe ou foi movido. Confira o link ou volte
            para a página inicial.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="bg-(--brand-primary) hover:bg-(--brand-secondary) text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Voltar para o início
            </Link>
            <Link
              to="/login"
              className="border border-(--brand-primary) text-(--brand-primary) hover:bg-(--brand-primary) hover:text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default NotFound;
