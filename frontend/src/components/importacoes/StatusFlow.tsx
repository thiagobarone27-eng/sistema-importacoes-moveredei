import { Check } from "lucide-react";
import type { HistoricoStatusItem, StatusImportacao } from "../../api/types";

interface StatusFlowProps {
  statusAtual: StatusImportacao;
  todosStatus: StatusImportacao[];
  historico: HistoricoStatusItem[];
}

/**
 * Linha do tempo horizontal com as etapas de fluxo normal do processo.
 * Quando o status atual e uma excecao (categoria "excecao"), a etapa
 * destacada e a ultima etapa de fluxo efetivamente alcancada (pelo
 * historico), e um aviso separado sinaliza a excecao em vigor.
 */
export function StatusFlow({ statusAtual, todosStatus, historico }: StatusFlowProps) {
  const etapasFluxo = todosStatus.filter((s) => s.categoria === "fluxo").sort((a, b) => a.ordem - b.ordem);

  let ordemAtual: number;
  if (statusAtual.categoria === "fluxo") {
    ordemAtual = statusAtual.ordem;
  } else {
    const fluxosNoHistorico = historico
      .filter((h) => {
        const st = todosStatus.find((s) => s.id === h.statusNovoId);
        return st?.categoria === "fluxo";
      })
      .map((h) => todosStatus.find((s) => s.id === h.statusNovoId)!.ordem);
    ordemAtual = fluxosNoHistorico.length > 0 ? Math.max(...fluxosNoHistorico) : 0;
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max items-center">
        {etapasFluxo.map((etapa, idx) => {
          const concluida = etapa.ordem < ordemAtual;
          const atual = etapa.ordem === ordemAtual && statusAtual.categoria === "fluxo";
          const futura = etapa.ordem > ordemAtual;
          return (
            <div key={etapa.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5" style={{ width: 116 }}>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                    atual
                      ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/20"
                      : concluida
                        ? "border-good-500 bg-good-500 text-white"
                        : "border-ink-300 bg-white text-ink-400"
                  }`}
                >
                  {concluida ? <Check size={16} /> : <span>{etapa.icone}</span>}
                </div>
                <p
                  className={`text-center text-[11px] font-medium leading-tight ${
                    atual ? "text-brand-700" : concluida ? "text-good-700" : futura ? "text-ink-400" : "text-ink-600"
                  }`}
                >
                  {etapa.label}
                </p>
              </div>
              {idx < etapasFluxo.length - 1 && (
                <div className={`h-0.5 w-8 shrink-0 sm:w-12 ${concluida ? "bg-good-400" : "bg-ink-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
