import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { StatusImportacao } from "../../api/types";
import { Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";

interface StatusChangerProps {
  statusAtual: StatusImportacao;
  todosStatus: StatusImportacao[];
  onAplicar: (statusId: number, observacao?: string) => Promise<void>;
}

export function StatusChanger({ statusAtual, todosStatus, onAplicar }: StatusChangerProps) {
  const [statusId, setStatusId] = useState<number>(statusAtual.id);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fluxo = todosStatus.filter((s) => s.categoria === "fluxo").sort((a, b) => a.ordem - b.ordem);
  const excecoes = todosStatus.filter((s) => s.categoria === "excecao").sort((a, b) => a.ordem - b.ordem);

  async function aplicarRapido(id: number) {
    setEnviando(true);
    try {
      await onAplicar(id);
      setStatusId(id);
    } finally {
      setEnviando(false);
    }
  }

  async function handleSubmit() {
    if (statusId === statusAtual.id && !observacao) return;
    setEnviando(true);
    try {
      await onAplicar(statusId, observacao || undefined);
      setObservacao("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-500">Status atual:</span>
        <StatusBadge status={statusAtual} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-ink-500">
          Aplicar status de exceção (pode ser marcado a qualquer momento)
        </p>
        <div className="flex flex-wrap gap-2">
          {excecoes.map((s) => (
            <button
              key={s.id}
              disabled={enviando}
              onClick={() => aplicarRapido(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                s.id === statusAtual.id
                  ? "border-transparent text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:bg-ink-50"
              }`}
              style={s.id === statusAtual.id ? { backgroundColor: s.corHex } : undefined}
            >
              <span>{s.icone}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-ink-100 pt-4">
        <p className="mb-2 text-xs font-medium text-ink-500">Mudar etapa de fluxo / registrar observação</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={statusId} onChange={(e) => setStatusId(Number(e.target.value))} className="sm:w-64">
            <optgroup label="Fluxo">
              {fluxo.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Exceção">
              {excecoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          </Select>
          <Textarea
            rows={1}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (opcional)"
            className="flex-1"
          />
          <Button onClick={handleSubmit} loading={enviando} icon={<Send size={14} />} size="md">
            Aplicar
          </Button>
        </div>
      </div>
      {enviando && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <Loader2 size={12} className="animate-spin" /> Atualizando status...
        </div>
      )}
    </div>
  );
}
