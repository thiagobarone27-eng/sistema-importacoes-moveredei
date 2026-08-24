import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

/** Envolve rotas que exigem login. Sem sessao valida, manda para /login. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-500">
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
