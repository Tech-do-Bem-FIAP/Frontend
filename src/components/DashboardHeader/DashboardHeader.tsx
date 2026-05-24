import { LogOut, Database, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/logo-tech-do-bem.webp";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.cargo === "Administrador";
  const isAdminEspecial = user?.email === "admin@admin.com";

  return (
    <header className="bg-linear-to-b from-(--brand-secondary) to-(--brand-primary) text-white shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Tech do Bem" className="h-10 w-auto" />
          <div>
            <p className="font-semibold leading-tight">Tech do Bem</p>
            <div className="flex items-center gap-2 text-xs opacity-80">
              <span>{user?.nome}</span>
              {user?.cargo && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isAdmin
                      ? "bg-amber-300 text-amber-900"
                      : "bg-white/20 text-white"
                  }`}
                >
                  {user.cargo}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin/relatorios"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-4 py-1.5 text-sm font-medium"
              title="Relatórios consolidados"
            >
              <FileText className="w-4 h-4" />
              Relatórios
            </Link>
          )}
          {isAdminEspecial && (
            <Link
              to="/admin/sistema"
              className="flex items-center gap-2 bg-amber-300 hover:bg-amber-200 text-amber-900 transition-colors rounded-full px-4 py-1.5 text-sm font-medium"
              title="Reconstruir banco de dados"
            >
              <Database className="w-4 h-4" />
              Sistema
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-4 py-1.5 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
