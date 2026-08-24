import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getToken, onSessaoExpirada, setToken as persistToken } from "../api/client";
import { authApi } from "../api/endpoints";
import type { Usuario } from "../api/types";

interface AuthContextValue {
  usuario: Usuario | null;
  isAdmin: boolean;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Comeca "carregando" enquanto valida um token ja salvo (evita um flash
  // de tela de login antes de confirmar a sessao existente).
  const [carregando, setCarregando] = useState(true);

  const logout = useCallback(() => {
    persistToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCarregando(false);
      return;
    }
    authApi
      .me()
      .then(setUsuario)
      .catch(() => {
        // Token expirado/invalido - limpa silenciosamente, sem erro na tela.
        persistToken(null);
        setUsuario(null);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Qualquer chamada de API que voltar com 401 (fora do login) dispara este
  // evento - reage deslogando o usuario, o que manda ele de volta pro
  // /login via ProtectedRoute.
  useEffect(() => onSessaoExpirada(logout), [logout]);

  const login = useCallback(async (email: string, senha: string) => {
    const resposta = await authApi.login(email, senha);
    persistToken(resposta.token);
    setUsuario(resposta.usuario);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, isAdmin: usuario?.papel === "admin", carregando, login, logout }),
    [usuario, carregando, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa ser usado dentro de <AuthProvider>.");
  return ctx;
}
