import { Link } from "react-router-dom";
import { ChevronRight, Gauge, Layers, Plug, Users } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody } from "../components/ui/Card";

export function Configuracoes() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Ajustes gerais do sistema." />

      <Link to="/configuracoes/eficiencia">
        <Card className="transition-shadow hover:shadow-md">
          <CardBody className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Gauge size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">Eficiência</p>
                <p className="text-xs text-ink-500">Limiares de classificação de eficiência (5 níveis) e alertas.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-ink-300" />
          </CardBody>
        </Card>
      </Link>

      <Link to="/configuracoes/usuarios">
        <Card className="transition-shadow hover:shadow-md">
          <CardBody className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Users size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">Usuários e permissões</p>
                <p className="text-xs text-ink-500">Controle de acesso multiusuário com papéis e permissões.</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-ink-300" />
          </CardBody>
        </Card>
      </Link>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlaceholderCard
          icon={Layers}
          titulo="Multiempresa"
          descricao="Gestão de múltiplas empresas importadoras no mesmo sistema."
        />
        <PlaceholderCard
          icon={Plug}
          titulo="Integrações"
          descricao="Conexão com ERPs, câmbio automático e sistemas aduaneiros."
        />
      </div>
    </div>
  );
}

function PlaceholderCard({
  icon: Icon,
  titulo,
  descricao,
}: {
  icon: typeof Users;
  titulo: string;
  descricao: string;
}) {
  return (
    <Card className="relative overflow-hidden opacity-80">
      <span className="absolute right-3 top-3 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
        Em breve
      </span>
      <CardBody>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-500">
          <Icon size={20} />
        </div>
        <p className="mt-3 text-sm font-semibold text-ink-700">{titulo}</p>
        <p className="mt-1 text-xs text-ink-500">{descricao}</p>
      </CardBody>
    </Card>
  );
}
