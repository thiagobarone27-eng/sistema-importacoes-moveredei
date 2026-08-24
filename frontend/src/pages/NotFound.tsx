import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Compass size={40} className="text-brand-400" />
      <div>
        <h1 className="text-lg font-semibold text-ink-800">Página não encontrada</h1>
        <p className="mt-1 text-sm text-ink-500">O endereço acessado não existe neste sistema.</p>
      </div>
      <Link to="/">
        <Button>Voltar ao Dashboard</Button>
      </Link>
    </div>
  );
}
