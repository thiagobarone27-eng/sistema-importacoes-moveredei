import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

/**
 * Envolve paginas/secoes inteiras que so administradores podem acessar
 * (ex: configuracoes, importar planilha). Visualizadores veem um aviso no
 * lugar do conteudo, em vez de um erro 403 vindo da API.
 */
export function SomenteAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-ink-200 bg-white px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          <ShieldAlert size={22} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-700">Acesso restrito a administradores</p>
          <p className="mt-1 text-xs text-ink-500">
            Sua conta tem permissão apenas de visualização. Fale com um administrador se precisar
            de acesso a esta área.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
