import type { ClassificacaoEficiencia } from "../../api/types";
import { EFICIENCIA_ESTILOS, EFICIENCIA_LABELS_LIMPOS } from "../../lib/eficienciaColors";

export function EfficiencyBadge({
  classificacao,
  size = "md",
}: {
  classificacao: ClassificacaoEficiencia;
  size?: "sm" | "md";
}) {
  const estilo = EFICIENCIA_ESTILOS[classificacao.codigo];
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${estilo.bg} ${estilo.text} ${estilo.border} ${padding}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${estilo.dot}`} />
      {EFICIENCIA_LABELS_LIMPOS[classificacao.codigo]}
    </span>
  );
}
