import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Lock, Mail, Ship } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input, Label } from "../components/ui/Field";
import { ApiError } from "../api/client";
import { useAuth } from "../lib/AuthContext";

export function Login() {
  const { usuario, carregando, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Ja logado (ou sessao salva ainda sendo validada) - manda de volta pra
  // onde o usuario tentou entrar, ou para o dashboard.
  if (carregando) return null;
  if (usuario) {
    const destino = (location.state as { from?: string } | null)?.from || "/";
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await login(email.trim(), senha);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Nao foi possivel entrar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2.5 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
            <Ship size={24} strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-base font-semibold text-ink-800">Moveredei</p>
            <p className="text-sm text-ink-500">Gestão de Importações</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"
        >
          <div>
            <Label>Email</Label>
            <div className="relative">
              <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Senha</Label>
            <div className="relative">
              <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-bad-50 px-3 py-2 text-xs font-medium text-bad-700">{erro}</p>
          )}

          <Button type="submit" className="w-full justify-center" disabled={enviando}>
            {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
            Entrar
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Acesso restrito à equipe Moveredei. Fale com um administrador para receber suas credenciais.
        </p>
      </div>
    </div>
  );
}
