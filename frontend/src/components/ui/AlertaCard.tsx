import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import type { Alerta } from "../../api/types";

const SEVERIDADE_ESTILO: Record<
  Alerta["severidade"],
  { border: string; bg: string; text: string; icon: typeof Info }
> = {
  critico: { border: "border-bad-200", bg: "bg-bad-50", text: "text-bad-700", icon: AlertOctagon },
  atencao: { border: "border-warn-200", bg: "bg-warn-50", text: "text-warn-700", icon: AlertTriangle },
  info: { border: "border-info-200", bg: "bg-info-50", text: "text-info-700", icon: Info },
};

const TIPO_LABEL: Record<string, string> = {
  ATRASADA: "Atrasada",
  CUSTO_ACIMA_HISTORICO: "Custo acima do histórico",
  OVERHEAD_ACIMA_LIMITE: "Overhead elevado",
  FRETE_OU_IMPOSTO_ACIMA_PADRAO: "Frete/imposto fora do padrão",
  SEM_ATUALIZACAO: "Sem atualização recente",
  MARKUP_MUITO_ALTO: "Markup muito alto",
};

export function AlertaCard({ alerta }: { alerta: Alerta }) {
  const estilo = SEVERIDADE_ESTILO[alerta.severidade];
  const Icon = estilo.icon;
  return (
    <Link
      to={`/importacoes/${alerta.importacaoId}`}
      className={`block rounded-xl border ${estilo.border} ${estilo.bg} px-4 py-3 transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={17} className={`mt-0.5 shrink-0 ${estilo.text}`} />
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${estilo.text}`}>
            {TIPO_LABEL[alerta.tipo] ?? alerta.tipo}
            {alerta.numeroProcesso ? ` · ${alerta.numeroProcesso}` : ""}
          </p>
          <p className="mt-0.5 text-sm text-ink-700">{alerta.mensagem}</p>
        </div>
      </div>
    </Link>
  );
}
