import { useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Gauge,
  ListChecks,
  Printer,
  Receipt,
  ScrollText,
  TrendingUp,
  Boxes,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FiltrosPanel } from "../components/filters/FiltrosPanel";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { useAsync } from "../lib/useAsync";
import { useFiltrosUrl } from "../lib/useFiltros";
import { useCatalogos } from "../lib/useCatalogos";
import { relatoriosApi } from "../api/endpoints";
import { baixarBlob } from "../lib/downloadBlob";
import { formatDate } from "../lib/format";
import type { TipoRelatorio } from "../api/types";

interface RelatorioDef {
  tipo: TipoRelatorio;
  label: string;
  descricao: string;
  icon: typeof BarChart3;
}

const RELATORIOS: RelatorioDef[] = [
  { tipo: "geral", label: "Geral", descricao: "Visão completa de todas as importações", icon: ListChecks },
  { tipo: "eficiencia", label: "Eficiência", descricao: "Indicadores e classificação de eficiência", icon: Gauge },
  { tipo: "custos", label: "Custos", descricao: "Detalhamento de impostos, frete e aduaneiro", icon: Receipt },
  { tipo: "por-produto", label: "Por produto", descricao: "Consolidado agrupado por produto", icon: Boxes },
  { tipo: "por-empresa", label: "Por empresa", descricao: "Consolidado agrupado por empresa", icon: Building2 },
  { tipo: "em-andamento", label: "Em andamento", descricao: "Importações ainda não concluídas", icon: Clock3 },
  { tipo: "concluidas", label: "Concluídas", descricao: "Importações finalizadas", icon: CheckCircle2 },
  { tipo: "atrasadas", label: "Atrasadas", descricao: "Importações com alerta de atraso", icon: ScrollText },
  { tipo: "comparativo-periodos", label: "Comparativo por período", descricao: "Totais agrupados por mês", icon: BarChart3 },
  { tipo: "evolucao-custos", label: "Evolução de custos", descricao: "Série histórica de custos por mês", icon: TrendingUp },
];

function formatarValorCelula(valor: unknown, coluna?: { key: string; header: string }): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "number") {
    const ehPercentual =
      coluna && (/pct/i.test(coluna.key) || coluna.header.includes("%") || /^%/.test(coluna.header));
    if (ehPercentual) {
      return `${(valor * 100).toFixed(1)}%`;
    }
    if (coluna && /markup/i.test(coluna.key)) {
      return `${valor.toFixed(2)}x`;
    }
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(valor);
  }
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}T/.test(valor)) {
    return formatDate(valor);
  }
  return String(valor);
}

export function Relatorios() {
  const { filtros } = useFiltrosUrl();
  const catalogos = useCatalogos();
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>("geral");
  const [baixandoXlsx, setBaixandoXlsx] = useState(false);

  const relatorio = useAsync(() => relatoriosApi.obter(tipoSelecionado, filtros), [tipoSelecionado, JSON.stringify(filtros)]);

  async function handleExportarXlsx() {
    setBaixandoXlsx(true);
    try {
      const blob = await relatoriosApi.baixarXlsx(tipoSelecionado, filtros);
      baixarBlob(blob, `relatorio-${tipoSelecionado}.xlsx`);
    } finally {
      setBaixandoXlsx(false);
    }
  }

  function handleExportarPdf() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader title="Relatórios" subtitle="Selecione um relatório, ajuste os filtros e exporte." />
      </div>

      <div className="no-print">
        <FiltrosPanel
          campos={["periodo", "empresa", "produto", "status", "fornecedor"]}
          empresas={catalogos.empresas}
          produtos={catalogos.produtos}
          status={catalogos.status}
          fornecedores={catalogos.fornecedores}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 print:block">
        <div className="no-print grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
          {RELATORIOS.map((r) => (
            <button
              key={r.tipo}
              onClick={() => setTipoSelecionado(r.tipo)}
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                tipoSelecionado === r.tipo
                  ? "border-brand-300 bg-brand-50"
                  : "border-ink-200 bg-white hover:border-ink-300"
              }`}
            >
              <r.icon size={17} className={tipoSelecionado === r.tipo ? "text-brand-700" : "text-ink-400"} />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${tipoSelecionado === r.tipo ? "text-brand-800" : "text-ink-700"}`}>
                  {r.label}
                </p>
                <p className="text-xs text-ink-400">{r.descricao}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 print:col-span-full">
          <Card className="print:border-none print:shadow-none">
            <CardHeader
              title={relatorio.data?.titulo ?? "Relatório"}
              subtitle={relatorio.data ? `${relatorio.data.linhas.length} registro(s)` : undefined}
              actions={
                <div className="no-print flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<FileSpreadsheet size={14} />}
                    loading={baixandoXlsx}
                    onClick={handleExportarXlsx}
                    disabled={!relatorio.data || relatorio.data.linhas.length === 0}
                  >
                    Exportar Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Printer size={14} />}
                    onClick={handleExportarPdf}
                    disabled={!relatorio.data || relatorio.data.linhas.length === 0}
                  >
                    Exportar PDF
                  </Button>
                </div>
              }
            />
            <CardBody>
              {relatorio.loading && <LoadingState label="Gerando relatório..." />}
              {relatorio.error && <ErrorState message={relatorio.error} onRetry={relatorio.reload} />}
              {relatorio.data && relatorio.data.linhas.length === 0 && (
                <EmptyState title="Nenhum dado para este relatório com os filtros atuais" />
              )}
              {relatorio.data && relatorio.data.linhas.length > 0 && (
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full min-w-[640px] border-collapse text-sm print:min-w-0 print:table-fixed print:text-[9px]">
                    <thead>
                      <tr>
                        {relatorio.data.colunas.map((col) => (
                          <th
                            key={col.key}
                            className="whitespace-nowrap border-b border-ink-200 bg-ink-50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-500 print:whitespace-normal print:break-words print:bg-white print:px-1.5 print:py-1"
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {relatorio.data.linhas.map((linha, idx) => (
                        <tr key={idx}>
                          {relatorio.data!.colunas.map((col) => (
                            <td
                              key={col.key}
                              className="whitespace-nowrap px-3 py-2 text-ink-700 print:whitespace-normal print:break-words print:px-1.5 print:py-1"
                            >
                              {formatarValorCelula(linha[col.key], col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
